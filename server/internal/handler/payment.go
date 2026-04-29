package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/knnedy/nafasi/internal/middleware"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
)

type PaymentHandler struct {
	payments PaymentServicer
}

type OrderResponse struct {
	ID            string  `json:"id"`
	UserID        string  `json:"user_id"`
	EventID       string  `json:"event_id"`
	TicketTypeID  string  `json:"ticket_type_id"`
	Quantity      int32   `json:"quantity"`
	UnitPrice     float64 `json:"unit_price"`
	TotalAmount   float64 `json:"total_amount"`
	Currency      string  `json:"currency"`
	Status        string  `json:"status"`
	PaymentMethod string  `json:"payment_method"`
	PaymentRef    string  `json:"payment_ref,omitempty"`
	QrCode        string  `json:"qr_code,omitempty"`
	CheckedIn     bool    `json:"checked_in"`
	CheckedInAt   string  `json:"checked_in_at,omitempty"`
	CreatedAt     string  `json:"created_at"`
	UpdatedAt     string  `json:"updated_at"`
}

func NewPaymentHandler(payments PaymentServicer) *PaymentHandler {
	return &PaymentHandler{payments: payments}
}

// InitiatePayment godoc
// @Summary Initiate payment
// @Description Initiates a payment (e.g. M-Pesa STK push)
// @Tags Payments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body service.InitiatePaymentInput true "Payment initiation payload"
// @Success 200 {object} service.PaymentResult
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /payments/initiate [post]
func (h *PaymentHandler) InitiatePayment(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	var input service.InitiatePaymentInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	result, err := h.payments.InitiatePayment(r.Context(), userID, input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, result)
}

// MpesaCallback godoc
// @Summary M-Pesa callback
// @Description Safaricom callback endpoint for payment status updates (no authentication)
// @Tags Payments
// @Accept json
// @Produce json
// @Param input body service.MpesaCallback true "M-Pesa callback payload"
// @Success 200 {object} map[string]string "Safaricom acknowledgment response"
// @Failure 400 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /payments/mpesa/callback [post]
func (h *PaymentHandler) MpesaCallback(w http.ResponseWriter, r *http.Request) {
	var callback service.MpesaCallback
	if err := json.NewDecoder(r.Body).Decode(&callback); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	if err := h.payments.HandleMpesaCallback(r.Context(), callback); err != nil {
		slog.Error("mpesa callback failed", "err", err)
		response.WriteError(w, err)
		return
	}

	// Safaricom expects exactly this type of response
	response.WriteJSON(w, http.StatusOK, map[string]string{
		"ResultCode": "0",
		"ResultDesc": "Accepted",
	})
}

// QueryPaymentStatus godoc
// @Summary Get payment status
// @Description Retrieves the status of a payment by order ID
// @Tags Payments
// @Produce json
// @Security BearerAuth
// @Param orderID path string true "Order ID"
// @Success 200 {object} OrderResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /payments/status/{orderID} [get]
func (h *PaymentHandler) QueryPaymentStatus(w http.ResponseWriter, r *http.Request) {
	orderID := chi.URLParam(r, "orderID")
	if orderID == "" {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	order, err := h.payments.QueryPaymentStatus(r.Context(), orderID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, order)
}
