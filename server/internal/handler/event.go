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

type EventHandler struct {
	event *service.EventService
}

func NewEventHandler(event *service.EventService) *EventHandler {
	return &EventHandler{event: event}
}

type EventResponse struct {
	ID          string  `json:"id"`
	OrganiserID string  `json:"organiser_id"`
	Title       string  `json:"title"`
	Slug        string  `json:"slug"`
	Description *string `json:"description,omitempty"`
	Location    *string `json:"location,omitempty"`
	Venue       *string `json:"venue,omitempty"`
	BannerUrl   *string `json:"banner_url,omitempty"`
	StartsAt    string  `json:"starts_at"`
	EndsAt      string  `json:"ends_at"`
	Status      string  `json:"status"`
	IsOnline    bool    `json:"is_online"`
	OnlineUrl   *string `json:"online_url,omitempty"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

func toEventResponse(event repository.Event) EventResponse {
	return EventResponse{
		ID:          event.ID.String(),
		OrganiserID: event.OrganiserID.String(),
		Title:       event.Title,
		Slug:        event.Slug,
		Description: &event.Description.String,
		Location:    &event.Location.String,
		Venue:       &event.Venue.String,
		BannerUrl:   &event.BannerUrl.String,
		StartsAt:    event.StartsAt.Time.Format(time.RFC3339),
		EndsAt:      event.EndsAt.Time.Format(time.RFC3339),
		Status:      string(event.Status),
		IsOnline:    event.IsOnline,
		OnlineUrl:   &event.OnlineUrl.String,
		CreatedAt:   event.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:   event.UpdatedAt.Time.Format(time.RFC3339),
	}
}

// Create godoc
// @Summary Create event
// @Description Creates a new event (organiser only)
// @Tags Events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body service.CreateEventInput true "Create event payload"
// @Success 201 {object} EventResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events [post]
func (h *EventHandler) Create(w http.ResponseWriter, r *http.Request) {
	// get authenticated user ID from context
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	var input service.CreateEventInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	createdEvent, err := h.event.CreateEvent(r.Context(), userID, input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusCreated, toEventResponse(createdEvent))
}

// GetById godoc
// @Summary Get event by ID
// @Description Returns a single event by its ID
// @Tags Events
// @Produce json
// @Param eventID path string true "Event ID"
// @Success 200 {object} EventResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events/{eventID} [get]
func (h *EventHandler) GetById(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	event, err := h.event.GetEventByID(r.Context(), eventID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, toEventResponse(event))
}

// GetBySlug godoc
// @Summary Get event by slug
// @Description Returns a single event by its slug
// @Tags Events
// @Produce json
// @Param slug path string true "Event slug"
// @Success 200 {object} EventResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events/slug/{slug} [get]
func (h *EventHandler) GetBySlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if slug == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	event, err := h.event.GetEventBySlug(r.Context(), slug)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, toEventResponse(event))
}

// GetByOrganiser godoc
// @Summary Get events by organiser
// @Description Returns all events created by a specific organiser
// @Tags Events
// @Produce json
// @Param organiserID path string true "Organiser ID"
// @Success 200 {array} EventResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events/organiser/{organiserID} [get]
func (h *EventHandler) GetByOrganiser(w http.ResponseWriter, r *http.Request) {
	organiserID := chi.URLParam(r, "organiserID")
	if organiserID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	events, err := h.event.GetEventsByOrganiser(r.Context(), organiserID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	var eventResponses []EventResponse
	for _, event := range events {
		eventResponses = append(eventResponses, toEventResponse(event))
	}

	response.WriteJSON(w, http.StatusOK, eventResponses)
}

// GetPublished godoc
// @Summary Get published events
// @Description Returns all published events
// @Tags Events
// @Produce json
// @Success 200 {array} EventResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events/published [get]
func (h *EventHandler) GetPublished(w http.ResponseWriter, r *http.Request) {
	events, err := h.event.GetPublishedEvents(r.Context())
	if err != nil {
		response.WriteError(w, err)
		return
	}

	var eventResponses []EventResponse
	for _, event := range events {
		eventResponses = append(eventResponses, toEventResponse(event))
	}

	response.WriteJSON(w, http.StatusOK, eventResponses)
}

// GetUpcoming godoc
// @Summary Get upcoming events
// @Description Returns upcoming events based on start date
// @Tags Events
// @Produce json
// @Success 200 {array} EventResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events/upcoming [get]
func (h *EventHandler) GetUpcoming(w http.ResponseWriter, r *http.Request) {
	events, err := h.event.GetUpcomingEvents(r.Context())
	if err != nil {
		response.WriteError(w, err)
		return
	}

	var eventResponses []EventResponse
	for _, event := range events {
		eventResponses = append(eventResponses, toEventResponse(event))
	}

	response.WriteJSON(w, http.StatusOK, eventResponses)
}

// Update godoc
// @Summary Update event
// @Description Updates an existing event (organiser only)
// @Tags Events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Param input body service.UpdateEventInput true "Update event payload"
// @Success 200 {object} EventResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events/{eventID} [patch]
func (h *EventHandler) Update(w http.ResponseWriter, r *http.Request) {
	// get authenticated user ID from context
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	var input service.UpdateEventInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	updatedEvent, err := h.event.UpdateEvent(r.Context(), eventID, userID, input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, toEventResponse(updatedEvent))
}

// UpdateStatus godoc
// @Summary Update event status
// @Description Updates the status of an event (e.g. draft, published)
// @Tags Events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Param input body service.UpdateEventStatusInput true "Update status payload"
// @Success 200 {object} EventResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events/{eventID}/status [patch]
func (h *EventHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	// get authenticated user ID from context
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	var input service.UpdateEventStatusInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	updatedEvent, err := h.event.UpdateEventStatus(r.Context(), eventID, userID, input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, toEventResponse(updatedEvent))
}

// Delete godoc
// @Summary Delete event
// @Description Deletes an event (organiser only)
// @Tags Events
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Success 200 {object} map[string]string
// @Failure 401 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /events/{eventID} [delete]
func (h *EventHandler) Delete(w http.ResponseWriter, r *http.Request) {
	// get authenticated user ID from context
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	if err := h.event.DeleteEvent(r.Context(), eventID, userID); err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, nil)
}
