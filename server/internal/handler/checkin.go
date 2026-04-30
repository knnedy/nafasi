package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/knnedy/nafasi/internal/middleware"
	"github.com/knnedy/nafasi/internal/response"
)

type CheckInHandler struct {
	checkIn CheckInServicer
}

func NewCheckInHandler(checkIn CheckInServicer) *CheckInHandler {
	return &CheckInHandler{checkIn: checkIn}
}

type checkInRequest struct {
	QRCode string `json:"qr_code"`
}

// CheckIn godoc
// @Summary Check in ticket
// @Description Validates QR code and marks ticket as checked in (organiser only)
// @Tags CheckIn
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body checkInRequest true "Check-in payload"
// @Success 200 {object} service.CheckInResult
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /checkin [post]
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

// GetCheckedInOrders godoc
// @Summary Get checked-in orders
// @Description Returns all orders that have been checked in for an event
// @Tags CheckIn
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Success 200 {array} service.CheckInResult
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /checkin/{eventID} [get]
func (h *CheckInHandler) GetCheckedInOrders(w http.ResponseWriter, r *http.Request) {
	organiserID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

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
