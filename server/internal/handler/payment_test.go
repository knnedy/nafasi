package handler_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/handler"
	"github.com/knnedy/nafasi/internal/handler/mock"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/assert"
	mocktestify "github.com/stretchr/testify/mock"
)

func makePaymentResult(orderID string) *service.PaymentResult {
	return &service.PaymentResult{
		OrderID:           orderID,
		CheckoutRequestID: "checkout-123",
		Message:           "STK push sent",
	}
}

func makeOrder(status repository.OrderStatus) *repository.Order {
	return &repository.Order{
		ID:     pgtype.UUID{Bytes: uuid.New(), Valid: true},
		Status: status,
	}
}

func validPaymentInput() service.InitiatePaymentInput {
	return service.InitiatePaymentInput{
		EventID:       uuid.New().String(),
		TicketTypeID:  uuid.New().String(),
		Quantity:      1,
		PhoneNumber:   "0712345678",
		PaymentMethod: "MPESA",
	}
}

func makeSuccessCallbackPayload() service.MpesaCallback {
	cb := service.MpesaCallback{}
	cb.Body.StkCallback.ResultCode = 0
	cb.Body.StkCallback.CheckoutRequestID = "checkout-123"
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

func makeFailedCallbackPayload() service.MpesaCallback {
	cb := service.MpesaCallback{}
	cb.Body.StkCallback.ResultCode = 1032
	cb.Body.StkCallback.CheckoutRequestID = "checkout-123"
	cb.Body.StkCallback.ResultDesc = "Request cancelled by user"
	return cb
}

// InitiatePayment
func TestInitiatePaymentHandler_Success(t *testing.T) {
	svc := new(mock.PaymentService)
	h := handler.NewPaymentHandler(svc)

	userID := uuid.New().String()
	input := validPaymentInput()
	orderID := uuid.New().String()

	svc.On("InitiatePayment", mocktestify.Anything, userID, input).
		Return(makePaymentResult(orderID), nil)

	w := httptest.NewRecorder()
	r := withUserID(
		httptest.NewRequest(http.MethodPost, "/api/v1/payments/initiate", toJSON(t, input)),
		userID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.InitiatePayment(w, r)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]any
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.True(t, resp["success"].(bool))

	svc.AssertExpectations(t)
}

func TestInitiatePaymentHandler_InvalidBody(t *testing.T) {
	svc := new(mock.PaymentService)
	h := handler.NewPaymentHandler(svc)

	userID := uuid.New().String()

	w := httptest.NewRecorder()
	r := withUserID(
		httptest.NewRequest(http.MethodPost, "/api/v1/payments/initiate", nil),
		userID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.InitiatePayment(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

func TestInitiatePaymentHandler_TicketNotFound(t *testing.T) {
	svc := new(mock.PaymentService)
	h := handler.NewPaymentHandler(svc)

	userID := uuid.New().String()
	input := validPaymentInput()

	svc.On("InitiatePayment", mocktestify.Anything, userID, input).
		Return((*service.PaymentResult)(nil), response.ErrNotFound)

	w := httptest.NewRecorder()
	r := withUserID(
		httptest.NewRequest(http.MethodPost, "/api/v1/payments/initiate", toJSON(t, input)),
		userID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.InitiatePayment(w, r)

	assert.Equal(t, http.StatusNotFound, w.Code)
	svc.AssertExpectations(t)
}

func TestInitiatePaymentHandler_InsufficientTickets(t *testing.T) {
	svc := new(mock.PaymentService)
	h := handler.NewPaymentHandler(svc)

	userID := uuid.New().String()
	input := validPaymentInput()

	svc.On("InitiatePayment", mocktestify.Anything, userID, input).
		Return((*service.PaymentResult)(nil), response.ErrInsufficientTickets)

	w := httptest.NewRecorder()
	r := withUserID(
		httptest.NewRequest(http.MethodPost, "/api/v1/payments/initiate", toJSON(t, input)),
		userID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.InitiatePayment(w, r)

	assert.Equal(t, http.StatusConflict, w.Code)
	svc.AssertExpectations(t)
}

func TestInitiatePaymentHandler_PaymentFailed(t *testing.T) {
	svc := new(mock.PaymentService)
	h := handler.NewPaymentHandler(svc)

	userID := uuid.New().String()
	input := validPaymentInput()

	svc.On("InitiatePayment", mocktestify.Anything, userID, input).
		Return((*service.PaymentResult)(nil), response.ErrPaymentFailed)

	w := httptest.NewRecorder()
	r := withUserID(
		httptest.NewRequest(http.MethodPost, "/api/v1/payments/initiate", toJSON(t, input)),
		userID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.InitiatePayment(w, r)

	assert.Equal(t, http.StatusBadGateway, w.Code)
	svc.AssertExpectations(t)
}

// MpesaCallback
func TestMpesaCallbackHandler_Success(t *testing.T) {
	svc := new(mock.PaymentService)
	h := handler.NewPaymentHandler(svc)

	callback := makeSuccessCallbackPayload()

	svc.On("HandleMpesaCallback", mocktestify.Anything, callback).
		Return(nil)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/payments/mpesa/callback", toJSON(t, callback))
	r.Header.Set("Content-Type", "application/json")

	h.MpesaCallback(w, r)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]any
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	data := resp["data"].(map[string]any)
	assert.Equal(t, "0", data["ResultCode"])
	assert.Equal(t, "Accepted", data["ResultDesc"])

	svc.AssertExpectations(t)
}

func TestMpesaCallbackHandler_InvalidBody(t *testing.T) {
	svc := new(mock.PaymentService)
	h := handler.NewPaymentHandler(svc)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/payments/mpesa/callback", nil)
	r.Header.Set("Content-Type", "application/json")

	h.MpesaCallback(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

func TestMpesaCallbackHandler_Failed(t *testing.T) {
	svc := new(mock.PaymentService)
	h := handler.NewPaymentHandler(svc)

	callback := makeFailedCallbackPayload()

	svc.On("HandleMpesaCallback", mocktestify.Anything, callback).
		Return(nil)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/payments/mpesa/callback", toJSON(t, callback))
	r.Header.Set("Content-Type", "application/json")

	h.MpesaCallback(w, r)

	// safaricom always gets 200 even for failed payments
	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestMpesaCallbackHandler_ServiceError(t *testing.T) {
	svc := new(mock.PaymentService)
	h := handler.NewPaymentHandler(svc)

	callback := makeSuccessCallbackPayload()

	svc.On("HandleMpesaCallback", mocktestify.Anything, callback).
		Return(response.ErrDatabase)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/payments/mpesa/callback", toJSON(t, callback))
	r.Header.Set("Content-Type", "application/json")

	h.MpesaCallback(w, r)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	svc.AssertExpectations(t)
}

// QueryPaymentStatus
func TestQueryPaymentStatusHandler_Success(t *testing.T) {
	svc := new(mock.PaymentService)
	h := handler.NewPaymentHandler(svc)

	orderID := uuid.New().String()

	svc.On("QueryPaymentStatus", mocktestify.Anything, orderID).
		Return(makeOrder(repository.OrderStatusPAID), nil)

	w := httptest.NewRecorder()
	r := withChiParam(
		httptest.NewRequest(http.MethodGet, "/api/v1/payments/status/"+orderID, nil),
		"orderID", orderID,
	)

	h.QueryPaymentStatus(w, r)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]any
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.True(t, resp["success"].(bool))

	svc.AssertExpectations(t)
}

func TestQueryPaymentStatusHandler_NotFound(t *testing.T) {
	svc := new(mock.PaymentService)
	h := handler.NewPaymentHandler(svc)

	orderID := uuid.New().String()

	svc.On("QueryPaymentStatus", mocktestify.Anything, orderID).
		Return((*repository.Order)(nil), response.ErrNotFound)

	w := httptest.NewRecorder()
	r := withChiParam(
		httptest.NewRequest(http.MethodGet, "/api/v1/payments/status/"+orderID, nil),
		"orderID", orderID,
	)

	h.QueryPaymentStatus(w, r)

	assert.Equal(t, http.StatusNotFound, w.Code)
	svc.AssertExpectations(t)
}

func TestQueryPaymentStatusHandler_MissingOrderID(t *testing.T) {
	svc := new(mock.PaymentService)
	h := handler.NewPaymentHandler(svc)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/api/v1/payments/status/", nil)

	h.QueryPaymentStatus(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}
