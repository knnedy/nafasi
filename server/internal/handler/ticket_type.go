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
	ticketType *service.TicketTypeService
}

func NewTicketTypeHandler(ticketType *service.TicketTypeService) *TicketTypeHandler {
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
	var saleStarts, saleEnds *string

	if !ticketType.SaleStarts.Valid {
		ss := ticketType.SaleStarts.Time.Format(time.RFC3339)
		saleStarts = &ss
	}
	if !ticketType.SaleEnds.Valid {
		se := ticketType.SaleEnds.Time.Format(time.RFC3339)
		saleEnds = &se
	}

	return TicketTypeResponse{
		ID:           ticketType.ID.String(),
		EventID:      ticketType.EventID.String(),
		Name:         ticketType.Name,
		Description:  &ticketType.Description.String,
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

// POST /api/v1/event/[eventID]/ticket-type
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

// GET /api/v1/event/[eventID]/ticket-types/[ticketTypeID]
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

// GET /api/v1/event/[eventID]/ticket-types
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

// GET /api/v1/event/[eventID]/available-ticket-types
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

// PATCH /api/v1/ticket-type/[ticketTypeID]
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

// DELETE /api/v1/ticket-type/[ticketTypeID]
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
