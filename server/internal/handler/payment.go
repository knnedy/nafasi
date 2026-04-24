package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
)

type PaymentHandler struct {
	payments *service.PaymentService
}

func NewPaymentHandler(payments *service.PaymentService) *PaymentHandler {
	return &PaymentHandler{payments: payments}
}

// POST /api/v1/payments/initiate
func (h *PaymentHandler) InitiatePayment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)

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

// POST /api/v1/payments/mpesa/callback
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

// GET /api/v1/payments/status/{orderID}
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
