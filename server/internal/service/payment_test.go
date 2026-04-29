package service_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/repository/mock"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/assert"
	mocktestify "github.com/stretchr/testify/mock"
)

func newTestPaymentService(queries *mock.PaymentQueries, db *mock.PaymentDB, mpesa *service.MpesaService) *service.PaymentService {
	_ = queries
	return service.NewPaymentService(db, queries, mpesa, nil)
}

// InitiatePayment
func TestInitiatePayment_TicketNotFound(t *testing.T) {
	queries := new(mock.PaymentQueries)
	db := mock.NewPaymentDB()
	svc := newTestPaymentService(queries, db, nil)

	ticketTypeID := makeTicketTypeID()

	queries.On("GetTicketTypeById", mocktestify.Anything, ticketTypeID).
		Return(repository.TicketType{}, pgx.ErrNoRows)

	_, err := svc.InitiatePayment(context.Background(), uuid.New().String(), service.InitiatePaymentInput{
		EventID:       uuid.New().String(),
		TicketTypeID:  uuid.UUID(ticketTypeID.Bytes).String(),
		Quantity:      1,
		PhoneNumber:   "0712345678",
		PaymentMethod: "MPESA",
	})

	assert.ErrorIs(t, err, response.ErrNotFound)
	queries.AssertExpectations(t)
}

func TestInitiatePayment_InvalidUserID(t *testing.T) {
	queries := new(mock.PaymentQueries)
	db := mock.NewPaymentDB()
	svc := newTestPaymentService(queries, db, nil)

	_, err := svc.InitiatePayment(context.Background(), "not-a-uuid", service.InitiatePaymentInput{
		EventID:       uuid.New().String(),
		TicketTypeID:  uuid.New().String(),
		Quantity:      1,
		PhoneNumber:   "0712345678",
		PaymentMethod: "MPESA",
	})

	assert.ErrorIs(t, err, response.ErrNotFound)
}

func TestInitiatePayment_InvalidPhoneNumber(t *testing.T) {
	queries := new(mock.PaymentQueries)
	db := mock.NewPaymentDB()
	svc := newTestPaymentService(queries, db, nil)

	_, err := svc.InitiatePayment(context.Background(), uuid.New().String(), service.InitiatePaymentInput{
		EventID:       uuid.New().String(),
		TicketTypeID:  uuid.New().String(),
		Quantity:      1,
		PhoneNumber:   "invalid-phone",
		PaymentMethod: "MPESA",
	})

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

func TestInitiatePayment_InsufficientTickets(t *testing.T) {
	queries := new(mock.PaymentQueries)
	db := mock.NewPaymentDB()
	svc := newTestPaymentService(queries, db, nil)

	ticketTypeID := makeTicketTypeID()

	queries.On("GetTicketTypeById", mocktestify.Anything, ticketTypeID).
		Return(repository.TicketType{
			ID:           ticketTypeID,
			Price:        500000,
			Currency:     "KES",
			Quantity:     10,
			QuantitySold: 10, // sold out
			IsFree:       false,
		}, nil)

	_, err := svc.InitiatePayment(context.Background(), uuid.New().String(), service.InitiatePaymentInput{
		EventID:       uuid.New().String(),
		TicketTypeID:  uuid.UUID(ticketTypeID.Bytes).String(),
		Quantity:      1,
		PhoneNumber:   "0712345678",
		PaymentMethod: "MPESA",
	})

	assert.ErrorIs(t, err, response.ErrInsufficientTickets)
	queries.AssertExpectations(t)
}

func TestInitiatePayment_DatabaseError(t *testing.T) {
	queries := new(mock.PaymentQueries)
	db := mock.NewPaymentDB()
	svc := newTestPaymentService(queries, db, nil)

	ticketTypeID := makeTicketTypeID()

	queries.On("GetTicketTypeById", mocktestify.Anything, ticketTypeID).
		Return(repository.TicketType{
			ID:           ticketTypeID,
			Price:        500000,
			Currency:     "KES",
			Quantity:     100,
			QuantitySold: 0,
			IsFree:       false,
		}, nil)

	queries.On("CreateOrder", mocktestify.Anything, mocktestify.Anything).
		Return(repository.Order{}, errors.New("db error"))

	_, err := svc.InitiatePayment(context.Background(), uuid.New().String(), service.InitiatePaymentInput{
		EventID:       uuid.New().String(),
		TicketTypeID:  uuid.UUID(ticketTypeID.Bytes).String(),
		Quantity:      1,
		PhoneNumber:   "0712345678",
		PaymentMethod: "MPESA",
	})

	assert.ErrorIs(t, err, response.ErrDatabase)
	queries.AssertExpectations(t)
}

// QueryPaymentStatus
func TestQueryPaymentStatus_Success(t *testing.T) {
	queries := new(mock.PaymentQueries)
	db := mock.NewPaymentDB()
	svc := newTestPaymentService(queries, db, nil)

	orderID := pgtype.UUID{Bytes: uuid.New(), Valid: true}

	queries.On("GetOrderById", mocktestify.Anything, orderID).
		Return(repository.Order{
			ID:     orderID,
			Status: repository.OrderStatusPAID,
		}, nil)

	order, err := svc.QueryPaymentStatus(context.Background(), uuid.UUID(orderID.Bytes).String())

	assert.NoError(t, err)
	assert.Equal(t, repository.OrderStatusPAID, order.Status)
	queries.AssertExpectations(t)
}

func TestQueryPaymentStatus_NotFound(t *testing.T) {
	queries := new(mock.PaymentQueries)
	db := mock.NewPaymentDB()
	svc := newTestPaymentService(queries, db, nil)

	orderID := pgtype.UUID{Bytes: uuid.New(), Valid: true}

	queries.On("GetOrderById", mocktestify.Anything, orderID).
		Return(repository.Order{}, errors.New("not found"))

	_, err := svc.QueryPaymentStatus(context.Background(), uuid.UUID(orderID.Bytes).String())

	assert.ErrorIs(t, err, response.ErrNotFound)
	queries.AssertExpectations(t)
}

func TestQueryPaymentStatus_InvalidID(t *testing.T) {
	queries := new(mock.PaymentQueries)
	db := mock.NewPaymentDB()
	svc := newTestPaymentService(queries, db, nil)

	_, err := svc.QueryPaymentStatus(context.Background(), "not-a-uuid")

	assert.ErrorIs(t, err, response.ErrNotFound)
}

// HandleMpesaCallback
func TestHandleMpesaCallback_AlreadyPaid(t *testing.T) {
	queries := new(mock.PaymentQueries)
	db := mock.NewPaymentDB()
	svc := newTestPaymentService(queries, db, nil)

	checkoutRequestID := "checkout-123"

	queries.On("GetOrderByPaymentRef", mocktestify.Anything, pgtype.Text{String: checkoutRequestID, Valid: true}).
		Return(repository.Order{
			ID:     pgtype.UUID{Bytes: uuid.New(), Valid: true},
			Status: repository.OrderStatusPAID,
		}, nil)

	callback := makeSuccessCallback(checkoutRequestID)
	err := svc.HandleMpesaCallback(context.Background(), callback)

	assert.NoError(t, err)
	queries.AssertExpectations(t)
}

func TestHandleMpesaCallback_OrderNotFound(t *testing.T) {
	queries := new(mock.PaymentQueries)
	db := mock.NewPaymentDB()
	svc := newTestPaymentService(queries, db, nil)

	checkoutRequestID := "checkout-123"

	queries.On("GetOrderByPaymentRef", mocktestify.Anything, pgtype.Text{String: checkoutRequestID, Valid: true}).
		Return(repository.Order{}, errors.New("not found"))

	callback := makeSuccessCallback(checkoutRequestID)
	err := svc.HandleMpesaCallback(context.Background(), callback)

	assert.ErrorIs(t, err, response.ErrNotFound)
	queries.AssertExpectations(t)
}

func TestHandleMpesaCallback_PaymentFailed(t *testing.T) {
	queries := new(mock.PaymentQueries)
	db := mock.NewPaymentDB()
	svc := newTestPaymentService(queries, db, nil)

	orderID := pgtype.UUID{Bytes: uuid.New(), Valid: true}
	checkoutRequestID := "checkout-123"

	queries.On("GetOrderByPaymentRef", mocktestify.Anything, pgtype.Text{String: checkoutRequestID, Valid: true}).
		Return(repository.Order{
			ID:     orderID,
			Status: repository.OrderStatusPENDING,
		}, nil)

	queries.On("UpdateOrderStatus", mocktestify.Anything, repository.UpdateOrderStatusParams{
		ID:     orderID,
		Status: repository.OrderStatusFAILED,
	}).Return(repository.Order{ID: orderID, Status: repository.OrderStatusFAILED}, nil)

	callback := makeFailedCallback(checkoutRequestID)
	err := svc.HandleMpesaCallback(context.Background(), callback)

	assert.NoError(t, err)
	queries.AssertExpectations(t)
}

// helpers
func makeSuccessCallback(checkoutRequestID string) service.MpesaCallback {
	cb := service.MpesaCallback{}
	cb.Body.StkCallback.ResultCode = 0
	cb.Body.StkCallback.CheckoutRequestID = checkoutRequestID
	cb.Body.StkCallback.MerchantRequestID = "merchant-123"
	cb.Body.StkCallback.ResultDesc = "Success"
	cb.Body.StkCallback.CallbackMetadata = &struct {
		Item []struct {
			Name  string      `json:"Name"`
			Value interface{} `json:"Value"`
		} `json:"Item"`
	}{
		Item: []struct {
			Name  string      `json:"Name"`
			Value interface{} `json:"Value"`
		}{
			{Name: "MpesaReceiptNumber", Value: "NLJ7RT61SV"},
			{Name: "Amount", Value: float64(1000)},
			{Name: "PhoneNumber", Value: float64(254712345678)},
		},
	}
	return cb
}

func makeFailedCallback(checkoutRequestID string) service.MpesaCallback {
	cb := service.MpesaCallback{}
	cb.Body.StkCallback.ResultCode = 1032
	cb.Body.StkCallback.CheckoutRequestID = checkoutRequestID
	cb.Body.StkCallback.ResultDesc = "Request cancelled by user"
	return cb
}
