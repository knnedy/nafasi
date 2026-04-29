package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/knnedy/nafasi/internal/middleware"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
)

type TicketTypeHandler struct {
	ticketType TicketTypeServicer
}

func NewTicketTypeHandler(ticketType TicketTypeServicer) *TicketTypeHandler {
	return &TicketTypeHandler{ticketType: ticketType}
}

type TicketTypeResponse struct {
	ID           string  `json:"id"`
	EventID      string  `json:"event_id"`
	Name         string  `json:"name"`
	Description  *string `json:"description,omitempty"`
	Price        int64   `json:"price"`
	Currency     string  `json:"currency"`
	Quantity     int32   `json:"quantity"`
	QuantitySold int32   `json:"quantity_sold"`
	IsFree       bool    `json:"is_free"`
	SaleStarts   *string `json:"sale_starts,omitempty"`
	SaleEnds     *string `json:"sale_ends,omitempty"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}

func toTicketTypeResponse(ticketType repository.TicketType) TicketTypeResponse {
	var description, saleStarts, saleEnds *string

	if ticketType.Description.Valid {
		description = &ticketType.Description.String
	}

	if ticketType.SaleStarts.Valid {
		ss := ticketType.SaleStarts.Time.Format(time.RFC3339)
		saleStarts = &ss
	}
	if ticketType.SaleEnds.Valid {
		se := ticketType.SaleEnds.Time.Format(time.RFC3339)
		saleEnds = &se
	}

	return TicketTypeResponse{
		ID:           ticketType.ID.String(),
		EventID:      ticketType.EventID.String(),
		Name:         ticketType.Name,
		Description:  description,
		Price:        ticketType.Price,
		Currency:     ticketType.Currency,
		Quantity:     ticketType.Quantity,
		QuantitySold: ticketType.QuantitySold,
		IsFree:       ticketType.IsFree,
		SaleStarts:   saleStarts,
		SaleEnds:     saleEnds,
		CreatedAt:    ticketType.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:    ticketType.UpdatedAt.Time.Format(time.RFC3339),
	}
}

// Create godoc
// @Summary Create ticket type
// @Description Creates a ticket type for an event (organiser only)
// @Tags TicketTypes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Param input body service.CreateTicketTypeInput true "Create ticket type payload"
// @Success 201 {object} TicketTypeResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events/{eventID}/ticket-types [post]
func (h *TicketTypeHandler) Create(w http.ResponseWriter, r *http.Request) {
	// get authenticated user ID from context
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	// get event ID from URL
	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	var input service.CreateTicketTypeInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	createdTicketType, err := h.ticketType.CreateTicketType(r.Context(), userID, eventID, input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusCreated, toTicketTypeResponse(createdTicketType))
}

// GetById godoc
// @Summary Get ticket type by ID
// @Description Returns a specific ticket type
// @Tags TicketTypes
// @Produce json
// @Param eventID path string true "Event ID"
// @Param ticketTypeID path string true "Ticket Type ID"
// @Success 200 {object} TicketTypeResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events/{eventID}/ticket-types/{ticketTypeID} [get]
func (h *TicketTypeHandler) GetById(w http.ResponseWriter, r *http.Request) {
	ticketTypeID := chi.URLParam(r, "ticketTypeID")
	if ticketTypeID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	ticketType, err := h.ticketType.GetTicketTypeByID(r.Context(), ticketTypeID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, toTicketTypeResponse(ticketType))
}

// GetByEvent godoc
// @Summary Get ticket types by event
// @Description Returns all ticket types for a given event
// @Tags TicketTypes
// @Produce json
// @Param eventID path string true "Event ID"
// @Success 200 {array} TicketTypeResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events/{eventID}/ticket-types [get]
func (h *TicketTypeHandler) GetByEvent(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	ticketTypes, err := h.ticketType.GetTicketTypesByEvent(r.Context(), eventID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	var resp []TicketTypeResponse
	for _, tt := range ticketTypes {
		resp = append(resp, toTicketTypeResponse(tt))
	}

	response.WriteJSON(w, http.StatusOK, resp)
}

// GetAvailableByEvent godoc
// @Summary Get available ticket types
// @Description Returns ticket types that are currently available for purchase
// @Tags TicketTypes
// @Produce json
// @Param eventID path string true "Event ID"
// @Success 200 {array} TicketTypeResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events/{eventID}/ticket-types/available [get]
func (h *TicketTypeHandler) GetAvailableByEvent(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	ticketTypes, err := h.ticketType.GetAvailableTicketTypes(r.Context(), eventID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	var resp []TicketTypeResponse
	for _, tt := range ticketTypes {
		resp = append(resp, toTicketTypeResponse(tt))
	}

	response.WriteJSON(w, http.StatusOK, resp)
}

// Update godoc
// @Summary Update ticket type
// @Description Updates a ticket type (organiser only)
// @Tags TicketTypes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Param ticketTypeID path string true "Ticket Type ID"
// @Param input body service.UpdateTicketTypeInput true "Update ticket type payload"
// @Success 200 {object} TicketTypeResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events/{eventID}/ticket-types/{ticketTypeID} [patch]
func (h *TicketTypeHandler) Update(w http.ResponseWriter, r *http.Request) {
	// get authenticated user ID from context
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	ticketTypeID := chi.URLParam(r, "ticketTypeID")
	if ticketTypeID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	var input service.UpdateTicketTypeInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	updatedTicketType, err := h.ticketType.UpdateTicketType(r.Context(), ticketTypeID, userID, input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, toTicketTypeResponse(updatedTicketType))
}

// Delete godoc
// @Summary Delete ticket type
// @Description Deletes a ticket type (organiser only)
// @Tags TicketTypes
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Param ticketTypeID path string true "Ticket Type ID"
// @Success 200 {object} map[string]string
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events/{eventID}/ticket-types/{ticketTypeID} [delete]
func (h *TicketTypeHandler) Delete(w http.ResponseWriter, r *http.Request) {
	// get authenticated user ID from context
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	ticketTypeID := chi.URLParam(r, "ticketTypeID")
	if ticketTypeID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	if err := h.ticketType.DeleteTicketType(r.Context(), ticketTypeID, userID); err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, nil)
}
