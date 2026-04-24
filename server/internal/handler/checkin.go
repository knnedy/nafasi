package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/knnedy/nafasi/internal/middleware"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
)

type CheckInHandler struct {
	checkIn *service.CheckInService
}

func NewCheckInHandler(checkIn *service.CheckInService) *CheckInHandler {
	return &CheckInHandler{checkIn: checkIn}
}

type checkInRequest struct {
	QRCode string `json:"qr_code"`
}

// POST /api/v1/checkin
func (h *CheckInHandler) CheckIn(w http.ResponseWriter, r *http.Request) {
	organiserID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	var req checkInRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	if req.QRCode == "" {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	result, err := h.checkIn.CheckIn(r.Context(), organiserID, req.QRCode)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, result)
}

// GET /api/v1/checkin/{eventID}
func (h *CheckInHandler) GetCheckedInOrders(w http.ResponseWriter, r *http.Request) {
	organiserID := r.Context().Value("user_id").(string)
	eventID := chi.URLParam(r, "eventID")

	if eventID == "" {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	orders, err := h.checkIn.GetCheckedInOrders(r.Context(), organiserID, eventID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, orders)
}
