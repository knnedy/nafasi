package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
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
	db       *repository.DB
	queries  *repository.Queries
	mpesa    *MpesaService
	validate *validator.Validate
	trans    ut.Translator
}

func NewPaymentService(db *repository.DB, mpesa *MpesaService) *PaymentService {
	validate, trans := newValidator()

	return &PaymentService{
		db:       db,
		queries:  db.Queries(),
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

func toNumeric(v int64) pgtype.Numeric {
	return pgtype.Numeric{
		Int:   new(big.Int).SetInt64(v),
		Exp:   0,
		Valid: true,
	}
}

func formatPhoneNumber(phone string) (string, error) {
	// Trim spaces
	phone = strings.TrimSpace(phone)

	// Remove spaces, dashes, parentheses, etc.
	re := regexp.MustCompile(`[^0-9+]`)
	phone = re.ReplaceAllString(phone, "")

	// Normalize formats (ORDER MATTERS)
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

	// Final validation (strict Kenyan mobile check)
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
	// Validate request body
	if err := s.validate.Struct(input); err != nil {
		return nil, formatValidationError(err, s.trans)
	}

	// Validate MPESA phone number
	var formattedPhone string
	if input.PaymentMethod == "MPESA" {
		normalized, err := formatPhoneNumber(input.PhoneNumber)
		if err != nil {
			return nil, response.ErrInvalidInput
		}
		formattedPhone = normalized
	}

	// Parse UUIDs
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

	// Fetch ticket type from DB
	ticketType, err := s.queries.GetTicketTypeById(
		ctx,
		pgtype.UUID{Bytes: parsedTicketTypeID, Valid: true},
	)
	if err != nil {
		return nil, response.ErrNotFound
	}

	// Calculate total
	totalAmount := ticketType.Price * int64(input.Quantity)

	// Create order (PENDING state)
	order, err := s.queries.CreateOrder(ctx, repository.CreateOrderParams{
		UserID:       pgtype.UUID{Bytes: parsedUserID, Valid: true},
		EventID:      pgtype.UUID{Bytes: parsedEventID, Valid: true},
		TicketTypeID: pgtype.UUID{Bytes: parsedTicketTypeID, Valid: true},
		Quantity:     input.Quantity,
		UnitPrice:    toNumeric(ticketType.Price),
		TotalAmount:  toNumeric(totalAmount),
		Currency:     ticketType.Currency,
		Status:       repository.OrderStatusPENDING,
		PaymentMethod: repository.NullPaymentMethod{
			PaymentMethod: repository.PaymentMethod(input.PaymentMethod),
			Valid:         true,
		},
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	// Route payment flow

	if ticketType.IsFree || input.PaymentMethod == "FREE" {
		return s.confirmFreeOrder(ctx, order, parsedTicketTypeID, input.Quantity)
	}

	if input.PaymentMethod == "MPESA" {
		return s.initiateMpesaPayment(ctx, order, formattedPhone, totalAmount)
	}

	return nil, response.ErrInvalidInput
}

func (s *PaymentService) confirmFreeOrder(ctx context.Context, order repository.Order, ticketTypeID uuid.UUID, quantity int32) (*PaymentResult, error) {
	qrCode, err := generateQRCode()
	if err != nil {
		return nil, response.ErrInternal
	}

	err = s.db.WithTransaction(ctx, func(q *repository.Queries) error {
		_, err := q.UpdateOrderPayment(ctx, repository.UpdateOrderPaymentParams{
			ID:            order.ID,
			Status:        repository.OrderStatusPAID,
			PaymentMethod: repository.NullPaymentMethod{PaymentMethod: repository.PaymentMethodFREE, Valid: true},
			PaymentRef:    pgtype.Text{String: "FREE", Valid: true},
		})
		if err != nil {
			return response.ErrDatabase
		}

		_, err = q.UpdateOrderQRCode(ctx, repository.UpdateOrderQRCodeParams{
			ID:     order.ID,
			QrCode: pgtype.Text{String: qrCode, Valid: true},
		})
		if err != nil {
			return response.ErrDatabase
		}

		if _, err = q.IncrementQuantitySold(ctx, repository.IncrementQuantitySoldParams{
			ID:           pgtype.UUID{Bytes: ticketTypeID, Valid: true},
			QuantitySold: quantity,
		}); err != nil {
			return response.ErrDatabase
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &PaymentResult{
		OrderID: uuid.UUID(order.ID.Bytes).String(),
		Message: "ticket confirmed",
	}, nil
}

func (s *PaymentService) initiateMpesaPayment(ctx context.Context, order repository.Order, phoneNumber string, totalAmount int64) (*PaymentResult, error) {
	// convert cents to KES
	mpesaAmount := totalAmount / 100

	// Trigger STK push
	stkResp, err := s.mpesa.InitiateSTKPush(ctx, STKPushRequest{
		PhoneNumber: phoneNumber,
		Amount:      mpesaAmount,
		OrderID:     uuid.UUID(order.ID.Bytes).String(),
		Description: "Ticket Payment",
	})
	if err != nil {
		// mark order failed if STK push fails
		_, _ = s.queries.UpdateOrderStatus(ctx, repository.UpdateOrderStatusParams{
			ID:     order.ID,
			Status: repository.OrderStatusFAILED,
		})
		return nil, response.ErrPaymentFailed
	}

	// Save CheckoutRequestID this links callback to order
	_, err = s.queries.UpdateOrderPayment(ctx, repository.UpdateOrderPaymentParams{
		ID:     order.ID,
		Status: repository.OrderStatusPENDING,
		PaymentMethod: repository.NullPaymentMethod{
			PaymentMethod: repository.PaymentMethodMPESA,
			Valid:         true,
		},
		PaymentRef: pgtype.Text{
			String: stkResp.CheckoutRequestID,
			Valid:  true,
		},
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return &PaymentResult{
		OrderID:           uuid.UUID(order.ID.Bytes).String(),
		CheckoutRequestID: stkResp.CheckoutRequestID,
		Message:           "STK push sent",
	}, nil
}

func (s *PaymentService) HandleMpesaCallback(ctx context.Context, callback MpesaCallback) error {
	result := s.mpesa.ParseCallback(callback)

	// Find order using CheckoutRequestID
	order, err := s.queries.GetOrderByPaymentRef(
		ctx,
		pgtype.Text{
			String: result.CheckoutRequestID,
			Valid:  true,
		},
	)
	if err != nil {
		return response.ErrNotFound
	}

	// Prevent duplicate processing (VERY IMPORTANT)
	if order.Status == repository.OrderStatusPAID {
		return nil
	}

	// If payment failed
	if !result.Success {
		_, err = s.queries.UpdateOrderStatus(ctx, repository.UpdateOrderStatusParams{
			ID:     order.ID,
			Status: repository.OrderStatusFAILED,
		})
		return err
	}

	qrCode, err := generateQRCode()
	if err != nil {
		return response.ErrInternal
	}

	// Payment SUCCESS - atomic transaction
	return s.db.WithTransaction(ctx, func(q *repository.Queries) error {
		_, err := q.UpdateOrderPayment(ctx, repository.UpdateOrderPaymentParams{
			ID:     order.ID,
			Status: repository.OrderStatusPAID,
			PaymentMethod: repository.NullPaymentMethod{
				PaymentMethod: repository.PaymentMethodMPESA,
				Valid:         true,
			},
			PaymentRef: pgtype.Text{String: result.MpesaReceiptNumber, Valid: true},
		})
		if err != nil {
			return fmt.Errorf("callback: failed to update order payment: %w", err)
		}

		_, err = q.UpdateOrderQRCode(ctx, repository.UpdateOrderQRCodeParams{
			ID:     order.ID,
			QrCode: pgtype.Text{String: qrCode, Valid: true},
		})
		if err != nil {
			return fmt.Errorf("callback: failed to update qr code: %w", err)
		}

		_, err = q.IncrementQuantitySold(ctx, repository.IncrementQuantitySoldParams{
			ID:           order.TicketTypeID,
			QuantitySold: order.Quantity,
		})
		if err != nil {
			return fmt.Errorf("callback: failed to increment quantity sold: %w", err)
		}

		return nil
	})
}

func (s *PaymentService) QueryPaymentStatus(ctx context.Context, orderID string) (*repository.Order, error) {
	parsedID, err := uuid.Parse(orderID)
	if err != nil {
		return nil, response.ErrNotFound
	}

	order, err := s.queries.GetOrderById(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		return nil, response.ErrNotFound
	}

	return &order, nil
}
