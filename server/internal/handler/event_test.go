package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
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

func makeHandlerEvent(organiserID string) repository.Event {
	parsedID, _ := uuid.Parse(organiserID)
	return repository.Event{
		ID:          pgtype.UUID{Bytes: uuid.New(), Valid: true},
		OrganiserID: pgtype.UUID{Bytes: parsedID, Valid: true},
		Title:       "Afrobeats Nairobi",
		Slug:        "afrobeats-nairobi-123456",
		Status:      repository.EventStatusDRAFT,
	}
}

func withChiParam(r *http.Request, key, value string) *http.Request {
	ctx := chi.NewRouteContext()
	ctx.URLParams.Add(key, value)
	return r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, ctx))
}

func validCreateEventInput() service.CreateEventInput {
	return service.CreateEventInput{
		Title:    "Afrobeats Nairobi",
		StartsAt: "2027-12-01T18:00:00Z",
		EndsAt:   "2027-12-01T23:00:00Z",
		Location: "Carnivore Grounds",
		IsOnline: false,
	}
}

// CreateEvent
func TestCreateEventHandler_Success(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	input := validCreateEventInput()

	svc.On("CreateEvent", mocktestify.Anything, organiserID, input).
		Return(makeHandlerEvent(organiserID), nil)

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodPost, "/api/v1/events", toJSON(t, input)), organiserID)
	r.Header.Set("Content-Type", "application/json")

	h.Create(w, r)

	assert.Equal(t, http.StatusCreated, w.Code)

	var resp map[string]any
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.True(t, resp["success"].(bool))

	svc.AssertExpectations(t)
}

func TestCreateEventHandler_InvalidBody(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodPost, "/api/v1/events", bytes.NewBufferString("not json")), organiserID)
	r.Header.Set("Content-Type", "application/json")

	h.Create(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

func TestCreateEventHandler_DatabaseError(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	input := validCreateEventInput()

	svc.On("CreateEvent", mocktestify.Anything, organiserID, input).
		Return(repository.Event{}, response.ErrDatabase)

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodPost, "/api/v1/events", toJSON(t, input)), organiserID)
	r.Header.Set("Content-Type", "application/json")

	h.Create(w, r)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	svc.AssertExpectations(t)
}

// GetById
func TestGetEventByIDHandler_Success(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetEventByID", mocktestify.Anything, eventID).
		Return(makeHandlerEvent(organiserID), nil)

	w := httptest.NewRecorder()
	r := withChiParam(httptest.NewRequest(http.MethodGet, "/api/v1/events/"+eventID, nil), "eventID", eventID)

	h.GetById(w, r)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]any
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.True(t, resp["success"].(bool))

	svc.AssertExpectations(t)
}

func TestGetEventByIDHandler_NotFound(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	eventID := uuid.New().String()

	svc.On("GetEventByID", mocktestify.Anything, eventID).
		Return(repository.Event{}, response.ErrNotFound)

	w := httptest.NewRecorder()
	r := withChiParam(httptest.NewRequest(http.MethodGet, "/api/v1/events/"+eventID, nil), "eventID", eventID)

	h.GetById(w, r)

	assert.Equal(t, http.StatusNotFound, w.Code)
	svc.AssertExpectations(t)
}

// GetBySlug
func TestGetEventBySlugHandler_Success(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	slug := "afrobeats-nairobi-123456"

	svc.On("GetEventBySlug", mocktestify.Anything, slug).
		Return(makeHandlerEvent(organiserID), nil)

	w := httptest.NewRecorder()
	r := withChiParam(httptest.NewRequest(http.MethodGet, "/api/v1/events/slug/"+slug, nil), "slug", slug)

	h.GetBySlug(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestGetEventBySlugHandler_NotFound(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	slug := "non-existent-slug"

	svc.On("GetEventBySlug", mocktestify.Anything, slug).
		Return(repository.Event{}, response.ErrNotFound)

	w := httptest.NewRecorder()
	r := withChiParam(httptest.NewRequest(http.MethodGet, "/api/v1/events/slug/"+slug, nil), "slug", slug)

	h.GetBySlug(w, r)

	assert.Equal(t, http.StatusNotFound, w.Code)
	svc.AssertExpectations(t)
}

// GetPublished
func TestGetPublishedEventsHandler_Success(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()

	svc.On("GetPublishedEvents", mocktestify.Anything, int32(20), int32(0)).
		Return([]repository.Event{
			makeHandlerEvent(organiserID),
		}, nil)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/api/v1/events/published", nil)

	h.GetPublished(w, r)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]any
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.True(t, resp["success"].(bool))

	svc.AssertExpectations(t)
}

func TestGetPublishedEventsHandler_Empty(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	svc.On("GetPublishedEvents", mocktestify.Anything, int32(20), int32(0)).
		Return([]repository.Event{}, nil)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/api/v1/events/published", nil)

	h.GetPublished(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

// GetUpcoming
func TestGetUpcomingEventsHandler_Success(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()

	svc.On("GetUpcomingEvents", mocktestify.Anything, int32(20), int32(0)).
		Return([]repository.Event{
			makeHandlerEvent(organiserID),
		}, nil)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/api/v1/events/upcoming", nil)

	h.GetUpcoming(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

// GetByOrganiser
func TestGetEventsByOrganiserHandler_Success(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()

	svc.On("GetEventsByOrganiser", mocktestify.Anything, organiserID).
		Return([]repository.Event{
			makeHandlerEvent(organiserID),
		}, nil)

	w := httptest.NewRecorder()
	r := withChiParam(
		httptest.NewRequest(http.MethodGet, "/api/v1/events/organiser/"+organiserID, nil),
		"organiserID", organiserID,
	)

	h.GetByOrganiser(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

// UpdateEvent
func TestUpdateEventHandler_Success(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()
	input := service.UpdateEventInput{
		Title:    "Updated Title",
		StartsAt: "2027-12-01T18:00:00Z",
		EndsAt:   "2027-12-01T23:00:00Z",
		Location: "Carnivore Grounds",
		IsOnline: false,
	}

	svc.On("UpdateEvent", mocktestify.Anything, eventID, organiserID, input).
		Return(repository.Event{
			ID:    pgtype.UUID{Bytes: uuid.New(), Valid: true},
			Title: "Updated Title",
		}, nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodPatch, "/api/v1/events/"+eventID, toJSON(t, input)),
			"eventID", eventID,
		),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.Update(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestUpdateEventHandler_Forbidden(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()
	input := service.UpdateEventInput{
		Title:    "Updated Title",
		StartsAt: "2027-12-01T18:00:00Z",
		EndsAt:   "2027-12-01T23:00:00Z",
		Location: "Carnivore Grounds",
		IsOnline: false,
	}

	svc.On("UpdateEvent", mocktestify.Anything, eventID, organiserID, input).
		Return(repository.Event{}, response.ErrForbidden)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodPatch, "/api/v1/events/"+eventID, toJSON(t, input)),
			"eventID", eventID,
		),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.Update(w, r)

	assert.Equal(t, http.StatusForbidden, w.Code)
	svc.AssertExpectations(t)
}

func TestUpdateEventHandler_InvalidBody(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodPatch, "/api/v1/events/"+eventID, bytes.NewBufferString("not json")),
			"eventID", eventID,
		),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.Update(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

// UpdateEventStatus
func TestUpdateEventStatusHandler_Success(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()
	input := service.UpdateEventStatusInput{
		Status: "PUBLISHED",
	}

	svc.On("UpdateEventStatus", mocktestify.Anything, eventID, organiserID, input).
		Return(repository.Event{
			ID:     pgtype.UUID{Bytes: uuid.New(), Valid: true},
			Status: repository.EventStatusPUBLISHED,
		}, nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodPatch, "/api/v1/events/"+eventID+"/status", toJSON(t, input)),
			"eventID", eventID,
		),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.UpdateStatus(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestUpdateEventStatusHandler_Forbidden(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()
	input := service.UpdateEventStatusInput{
		Status: "PUBLISHED",
	}

	svc.On("UpdateEventStatus", mocktestify.Anything, eventID, organiserID, input).
		Return(repository.Event{}, response.ErrForbidden)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodPatch, "/api/v1/events/"+eventID+"/status", toJSON(t, input)),
			"eventID", eventID,
		),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.UpdateStatus(w, r)

	assert.Equal(t, http.StatusForbidden, w.Code)
	svc.AssertExpectations(t)
}

// CancelEvent
func TestCancelEventHandler_Success(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("CancelEvent", mocktestify.Anything, eventID, organiserID).
		Return(repository.Event{
			ID:     pgtype.UUID{Bytes: uuid.New(), Valid: true},
			Status: repository.EventStatusCANCELLED,
		}, nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodPatch, "/api/v1/events/"+eventID, nil),
			"eventID", eventID,
		),
		organiserID,
	)

	h.Cancel(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestCancelEventHandler_Forbidden(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("CancelEvent", mocktestify.Anything, eventID, organiserID).
		Return(repository.Event{}, response.ErrForbidden)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodPatch, "/api/v1/events/"+eventID, nil),
			"eventID", eventID,
		),
		organiserID,
	)

	h.Cancel(w, r)

	assert.Equal(t, http.StatusForbidden, w.Code)
	svc.AssertExpectations(t)
}

func TestCancelEventHandler_NotFound(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("CancelEvent", mocktestify.Anything, eventID, organiserID).
		Return(repository.Event{}, response.ErrNotFound)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodPatch, "/api/v1/events/"+eventID, nil),
			"eventID", eventID,
		),
		organiserID,
	)

	h.Cancel(w, r)

	assert.Equal(t, http.StatusNotFound, w.Code)
	svc.AssertExpectations(t)
}

// DeleteEvent
func TestDeleteEventHandler_Success(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("DeleteEvent", mocktestify.Anything, eventID, organiserID).
		Return(repository.Event{}, nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodDelete, "/api/v1/events/"+eventID, nil),
			"eventID", eventID,
		),
		organiserID,
	)

	h.Delete(w, r)

	assert.Equal(t, http.StatusNoContent, w.Code)
	svc.AssertExpectations(t)
}

func TestDeleteEventHandler_Forbidden(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("DeleteEvent", mocktestify.Anything, eventID, organiserID).
		Return(repository.Event{}, response.ErrForbidden)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodDelete, "/api/v1/events/"+eventID, nil),
			"eventID", eventID,
		),
		organiserID,
	)

	h.Delete(w, r)

	assert.Equal(t, http.StatusForbidden, w.Code)
	svc.AssertExpectations(t)
}

func TestDeleteEventHandler_NotFound(t *testing.T) {
	svc := new(mock.EventService)
	h := handler.NewEventHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("DeleteEvent", mocktestify.Anything, eventID, organiserID).
		Return(repository.Event{}, response.ErrNotFound)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodDelete, "/api/v1/events/"+eventID, nil),
			"eventID", eventID,
		),
		organiserID,
	)

	h.Delete(w, r)

	assert.Equal(t, http.StatusNotFound, w.Code)
	svc.AssertExpectations(t)
}
