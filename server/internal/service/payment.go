package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"regexp"
	"strings"

	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
)

type PaymentService struct {
	db       *repository.Queries
	mpesa    *MpesaService
	validate *validator.Validate
	trans    ut.Translator
}

func NewPaymentService(db *repository.Queries, mpesa *MpesaService) *PaymentService {
	validate, trans := newValidator()
	return &PaymentService{
		db:       db,
		mpesa:    mpesa,
		validate: validate,
		trans:    trans,
	}
}

type InitiatePaymentInput struct {
	EventID       string `json:"event_id"        validate:"required,uuid"`
	TicketTypeID  string `json:"ticket_type_id"  validate:"required,uuid"`
	Quantity      int32  `json:"quantity"        validate:"required,min=1,max=10"`
	PhoneNumber   string `json:"phone_number"    validate:"required"`
	PaymentMethod string `json:"payment_method"  validate:"required,oneof=MPESA FREE"`
}

type PaymentResult struct {
	OrderID           string `json:"order_id"`
	CheckoutRequestID string `json:"checkout_request_id,omitempty"`
	Message           string `json:"message"`
}

func generateQRCode() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate qr code: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

func formatPhoneNumber(phone string) (string, error) {
	// 1. Trim spaces
	phone = strings.TrimSpace(phone)

	// 2. Remove spaces, dashes, parentheses, etc.
	re := regexp.MustCompile(`[^0-9+]`)
	phone = re.ReplaceAllString(phone, "")

	// 3. Normalize formats (ORDER MATTERS)
	switch {
	case strings.HasPrefix(phone, "+254"):
		phone = phone[1:] // strip '+'

	case strings.HasPrefix(phone, "254"):
		// already in correct base format

	case strings.HasPrefix(phone, "0") && len(phone) == 10:
		phone = "254" + phone[1:]

	case len(phone) == 9:
		phone = "254" + phone

	default:
		return "", errors.New("invalid phone number format")
	}

	// 4. Final validation (strict Kenyan mobile check)
	// Must be 12 digits and start with 2547 or 2541 (new prefixes)
	if len(phone) != 12 {
		return "", errors.New("invalid phone length")
	}

	if !strings.HasPrefix(phone, "2547") && !strings.HasPrefix(phone, "2541") {
		return "", errors.New("invalid Kenyan mobile prefix")
	}

	return phone, nil
}

func (s *PaymentService) InitiatePayment(ctx context.Context, userID string, input InitiatePaymentInput) (*PaymentResult, error) {
	if err := s.validate.Struct(input); err != nil {
		return nil, formatValidationError(err, s.trans)
	}

	// validate phone early for M-Pesa payments
	if input.PaymentMethod == "MPESA" {
		if _, err := formatPhoneNumber(input.PhoneNumber); err != nil {
			return nil, response.ErrInvalidInput
		}
	}

	// parse IDs
	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return nil, response.ErrNotFound
	}

	parsedEventID, err := uuid.Parse(input.EventID)
	if err != nil {
		return nil, response.ErrNotFound
	}

	parsedTicketTypeID, err := uuid.Parse(input.TicketTypeID)
	if err != nil {
		return nil, response.ErrNotFound
	}

	// verify ticket type exists and is available
	ticketType, err := s.db.GetTicketTypeById(ctx, pgtype.UUID{Bytes: parsedTicketTypeID, Valid: true})
	if err != nil {
		return nil, response.ErrNotFound
	}

	// check availability
	available := ticketType.Quantity - ticketType.QuantitySold
	if int32(available) < input.Quantity {
		return nil, response.ErrInsufficientTickets
	}

	// calculate total
	// price is int64 from sqlc — represents cents/lowest currency unit
	totalAmount := ticketType.Price * int64(input.Quantity)

	unitPriceNumeric := pgtype.Numeric{}
	if err := unitPriceNumeric.Scan(ticketType.Price); err != nil {
		return nil, response.ErrInternal
	}

	totalAmountNumeric := pgtype.Numeric{}
	if err := totalAmountNumeric.Scan(totalAmount); err != nil {
		return nil, response.ErrInternal
	}

	// create order in pending state
	order, err := s.db.CreateOrder(ctx, repository.CreateOrderParams{
		UserID:        pgtype.UUID{Bytes: parsedUserID, Valid: true},
		EventID:       pgtype.UUID{Bytes: parsedEventID, Valid: true},
		TicketTypeID:  pgtype.UUID{Bytes: parsedTicketTypeID, Valid: true},
		Quantity:      input.Quantity,
		UnitPrice:     unitPriceNumeric,
		TotalAmount:   totalAmountNumeric,
		Currency:      ticketType.Currency,
		Status:        repository.OrderStatusPENDING,
		PaymentMethod: repository.NullPaymentMethod{PaymentMethod: repository.PaymentMethod(input.PaymentMethod), Valid: true},
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	// handle free tickets
	if ticketType.IsFree || input.PaymentMethod == "FREE" {
		return s.confirmFreeOrder(ctx, order, parsedTicketTypeID, input.Quantity)
	}

	// handle M-Pesa
	if input.PaymentMethod == "MPESA" {
		return s.initiateMpesaPayment(ctx, order, input.PhoneNumber, totalAmount)
	}

	return nil, response.ErrInvalidInput
}

func (s *PaymentService) confirmFreeOrder(ctx context.Context, order repository.Order, ticketTypeID uuid.UUID, quantity int32) (*PaymentResult, error) {
	qrCode, err := generateQRCode()
	if err != nil {
		return nil, response.ErrInternal
	}

	_, err = s.db.UpdateOrderPayment(ctx, repository.UpdateOrderPaymentParams{
		ID:            order.ID,
		Status:        repository.OrderStatusPAID,
		PaymentMethod: repository.NullPaymentMethod{PaymentMethod: repository.PaymentMethodFREE, Valid: true},
		PaymentRef:    pgtype.Text{String: "FREE", Valid: true},
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	_, err = s.db.UpdateOrderQRCode(ctx, repository.UpdateOrderQRCodeParams{
		ID:     order.ID,
		QrCode: pgtype.Text{String: qrCode, Valid: true},
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	_, err = s.db.IncrementQuantitySold(ctx, repository.IncrementQuantitySoldParams{
		ID:           pgtype.UUID{Bytes: ticketTypeID, Valid: true},
		QuantitySold: quantity,
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return &PaymentResult{
		OrderID: uuid.UUID(order.ID.Bytes).String(),
		Message: "ticket confirmed",
	}, nil
}

func (s *PaymentService) initiateMpesaPayment(ctx context.Context, order repository.Order, phoneNumber string, totalAmount int64) (*PaymentResult, error) {
	stkResp, err := s.mpesa.InitiateSTKPush(ctx, STKPushRequest{
		PhoneNumber: phoneNumber,
		Amount:      totalAmount,
		OrderID:     uuid.UUID(order.ID.Bytes).String(),
		Description: "Nafasi Ticket Payment",
	})
	if err != nil {
		_, _ = s.db.UpdateOrderStatus(ctx, repository.UpdateOrderStatusParams{
			ID:     order.ID,
			Status: repository.OrderStatusFAILED,
		})
		return nil, response.ErrPaymentFailed
	}

	_, err = s.db.UpdateOrderPayment(ctx, repository.UpdateOrderPaymentParams{
		ID:            order.ID,
		Status:        repository.OrderStatusPENDING,
		PaymentMethod: repository.NullPaymentMethod{PaymentMethod: repository.PaymentMethodMPESA, Valid: true},
		PaymentRef:    pgtype.Text{String: stkResp.CheckoutRequestID, Valid: true},
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return &PaymentResult{
		OrderID:           uuid.UUID(order.ID.Bytes).String(),
		CheckoutRequestID: stkResp.CheckoutRequestID,
		Message:           "STK push sent, waiting for payment confirmation",
	}, nil
}

func (s *PaymentService) HandleMpesaCallback(ctx context.Context, callback MpesaCallback) error {
	result := s.mpesa.ParseCallback(callback)

	order, err := s.db.GetOrderByPaymentRef(ctx, pgtype.Text{String: result.CheckoutRequestID, Valid: true})
	if err != nil {
		return response.ErrNotFound
	}

	if !result.Success {
		_, err = s.db.UpdateOrderStatus(ctx, repository.UpdateOrderStatusParams{
			ID:     order.ID,
			Status: repository.OrderStatusFAILED,
		})
		return err
	}

	_, err = s.db.UpdateOrderPayment(ctx, repository.UpdateOrderPaymentParams{
		ID:            order.ID,
		Status:        repository.OrderStatusPAID,
		PaymentMethod: repository.NullPaymentMethod{PaymentMethod: repository.PaymentMethodMPESA, Valid: true},
		PaymentRef:    pgtype.Text{String: result.MpesaReceiptNumber, Valid: true},
	})
	if err != nil {
		return response.ErrDatabase
	}

	qrCode, err := generateQRCode()
	if err != nil {
		return response.ErrInternal
	}

	_, err = s.db.UpdateOrderQRCode(ctx, repository.UpdateOrderQRCodeParams{
		ID:     order.ID,
		QrCode: pgtype.Text{String: qrCode, Valid: true},
	})
	if err != nil {
		return response.ErrDatabase
	}

	_, err = s.db.IncrementQuantitySold(ctx, repository.IncrementQuantitySoldParams{
		ID:           order.TicketTypeID,
		QuantitySold: order.Quantity,
	})
	if err != nil {
		return response.ErrDatabase
	}

	return nil
}

func (s *PaymentService) QueryPaymentStatus(ctx context.Context, orderID string) (*repository.Order, error) {
	parsedID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, response.ErrNotFound
	}

	order, err := s.db.GetOrderById(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		return nil, response.ErrNotFound
	}

	return &order, nil
}
