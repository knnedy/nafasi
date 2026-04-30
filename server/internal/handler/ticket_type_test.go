package handler_test

import (
	"bytes"
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

func makeTicketTypeResponse(eventID pgtype.UUID) repository.TicketType {
	return repository.TicketType{
		ID:       pgtype.UUID{Bytes: uuid.New(), Valid: true},
		EventID:  eventID,
		Name:     "VIP",
		Price:    500000,
		Currency: "KES",
		Quantity: 100,
		IsFree:   false,
	}
}

func validCreateTicketTypeHandlerInput() service.CreateTicketTypeInput {
	return service.CreateTicketTypeInput{
		Name:     "VIP",
		Price:    "5000.00",
		Quantity: 100,
		IsFree:   false,
	}
}

// CreateTicketType
func TestCreateTicketTypeHandler_Success(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()
	parsedEventID, _ := uuid.Parse(eventID)
	input := validCreateTicketTypeHandlerInput()

	svc.On("CreateTicketType", mocktestify.Anything, organiserID, eventID, input).
		Return(makeTicketTypeResponse(pgtype.UUID{Bytes: parsedEventID, Valid: true}), nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodPost, "/api/v1/events/"+eventID+"/ticket-types", toJSON(t, input)),
			"eventID", eventID,
		),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.Create(w, r)

	assert.Equal(t, http.StatusCreated, w.Code)
	svc.AssertExpectations(t)
}

func TestCreateTicketTypeHandler_InvalidBody(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodPost, "/api/v1/events/"+eventID+"/ticket-types", bytes.NewBufferString("not json")),
			"eventID", eventID,
		),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.Create(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

func TestCreateTicketTypeHandler_Forbidden(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()
	input := validCreateTicketTypeHandlerInput()

	svc.On("CreateTicketType", mocktestify.Anything, organiserID, eventID, input).
		Return(repository.TicketType{}, response.ErrForbidden)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodPost, "/api/v1/events/"+eventID+"/ticket-types", toJSON(t, input)),
			"eventID", eventID,
		),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.Create(w, r)

	assert.Equal(t, http.StatusForbidden, w.Code)
	svc.AssertExpectations(t)
}

func TestCreateTicketTypeHandler_DatabaseError(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()
	input := validCreateTicketTypeHandlerInput()

	svc.On("CreateTicketType", mocktestify.Anything, organiserID, eventID, input).
		Return(repository.TicketType{}, response.ErrDatabase)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodPost, "/api/v1/events/"+eventID+"/ticket-types", toJSON(t, input)),
			"eventID", eventID,
		),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.Create(w, r)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	svc.AssertExpectations(t)
}

// GetById
func TestGetTicketTypeByIDHandler_Success(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	eventID := uuid.New().String()
	parsedEventID, _ := uuid.Parse(eventID)
	ticketTypeID := uuid.New().String()

	svc.On("GetTicketTypeByID", mocktestify.Anything, ticketTypeID).
		Return(makeTicketTypeResponse(pgtype.UUID{Bytes: parsedEventID, Valid: true}), nil)

	w := httptest.NewRecorder()
	r := withChiParam(
		withChiParam(
			httptest.NewRequest(http.MethodGet, "/api/v1/events/"+eventID+"/ticket-types/"+ticketTypeID, nil),
			"eventID", eventID,
		),
		"ticketTypeID", ticketTypeID,
	)

	h.GetById(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestGetTicketTypeByIDHandler_NotFound(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	eventID := uuid.New().String()
	ticketTypeID := uuid.New().String()

	svc.On("GetTicketTypeByID", mocktestify.Anything, ticketTypeID).
		Return(repository.TicketType{}, response.ErrNotFound)

	w := httptest.NewRecorder()
	r := withChiParam(
		withChiParam(
			httptest.NewRequest(http.MethodGet, "/api/v1/events/"+eventID+"/ticket-types/"+ticketTypeID, nil),
			"eventID", eventID,
		),
		"ticketTypeID", ticketTypeID,
	)

	h.GetById(w, r)

	assert.Equal(t, http.StatusNotFound, w.Code)
	svc.AssertExpectations(t)
}

// GetByEvent
func TestGetTicketTypesByEventHandler_Success(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	eventID := uuid.New().String()
	parsedEventID, _ := uuid.Parse(eventID)

	svc.On("GetTicketTypesByEvent", mocktestify.Anything, eventID).
		Return([]repository.TicketType{
			makeTicketTypeResponse(pgtype.UUID{Bytes: parsedEventID, Valid: true}),
			makeTicketTypeResponse(pgtype.UUID{Bytes: parsedEventID, Valid: true}),
		}, nil)

	w := httptest.NewRecorder()
	r := withChiParam(
		httptest.NewRequest(http.MethodGet, "/api/v1/events/"+eventID+"/ticket-types", nil),
		"eventID", eventID,
	)

	h.GetByEvent(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestGetTicketTypesByEventHandler_Empty(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	eventID := uuid.New().String()

	svc.On("GetTicketTypesByEvent", mocktestify.Anything, eventID).
		Return([]repository.TicketType{}, nil)

	w := httptest.NewRecorder()
	r := withChiParam(
		httptest.NewRequest(http.MethodGet, "/api/v1/events/"+eventID+"/ticket-types", nil),
		"eventID", eventID,
	)

	h.GetByEvent(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

// GetAvailableByEvent
func TestGetAvailableTicketTypesHandler_Success(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	eventID := uuid.New().String()
	parsedEventID, _ := uuid.Parse(eventID)

	svc.On("GetAvailableTicketTypes", mocktestify.Anything, eventID).
		Return([]repository.TicketType{
			makeTicketTypeResponse(pgtype.UUID{Bytes: parsedEventID, Valid: true}),
		}, nil)

	w := httptest.NewRecorder()
	r := withChiParam(
		httptest.NewRequest(http.MethodGet, "/api/v1/events/"+eventID+"/ticket-types/available", nil),
		"eventID", eventID,
	)

	h.GetAvailableByEvent(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

// UpdateTicketType
func TestUpdateTicketTypeHandler_Success(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()
	parsedEventID, _ := uuid.Parse(eventID)
	ticketTypeID := uuid.New().String()
	input := service.UpdateTicketTypeInput{
		Name:     "VVIP",
		Price:    "10000.00",
		Quantity: 50,
		IsFree:   false,
	}

	svc.On("UpdateTicketType", mocktestify.Anything, ticketTypeID, organiserID, input).
		Return(repository.TicketType{
			ID:      pgtype.UUID{Bytes: uuid.New(), Valid: true},
			EventID: pgtype.UUID{Bytes: parsedEventID, Valid: true},
			Name:    "VVIP",
		}, nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			withChiParam(
				httptest.NewRequest(http.MethodPatch, "/api/v1/events/"+eventID+"/ticket-types/"+ticketTypeID, toJSON(t, input)),
				"eventID", eventID,
			),
			"ticketTypeID", ticketTypeID,
		),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.Update(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestUpdateTicketTypeHandler_Forbidden(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()
	ticketTypeID := uuid.New().String()
	input := service.UpdateTicketTypeInput{
		Name:     "VVIP",
		Price:    "10000.00",
		Quantity: 50,
		IsFree:   false,
	}

	svc.On("UpdateTicketType", mocktestify.Anything, ticketTypeID, organiserID, input).
		Return(repository.TicketType{}, response.ErrForbidden)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			withChiParam(
				httptest.NewRequest(http.MethodPatch, "/api/v1/events/"+eventID+"/ticket-types/"+ticketTypeID, toJSON(t, input)),
				"eventID", eventID,
			),
			"ticketTypeID", ticketTypeID,
		),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.Update(w, r)

	assert.Equal(t, http.StatusForbidden, w.Code)
	svc.AssertExpectations(t)
}

func TestUpdateTicketTypeHandler_InvalidBody(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()
	ticketTypeID := uuid.New().String()

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			withChiParam(
				httptest.NewRequest(http.MethodPatch, "/api/v1/events/"+eventID+"/ticket-types/"+ticketTypeID, bytes.NewBufferString("not json")),
				"eventID", eventID,
			),
			"ticketTypeID", ticketTypeID,
		),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.Update(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

// DeleteTicketType
func TestDeleteTicketTypeHandler_Success(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()
	ticketTypeID := uuid.New().String()

	svc.On("DeleteTicketType", mocktestify.Anything, ticketTypeID, organiserID).
		Return(nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			withChiParam(
				httptest.NewRequest(http.MethodDelete, "/api/v1/events/"+eventID+"/ticket-types/"+ticketTypeID, nil),
				"eventID", eventID,
			),
			"ticketTypeID", ticketTypeID,
		),
		organiserID,
	)

	h.Delete(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestDeleteTicketTypeHandler_NotFound(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()
	ticketTypeID := uuid.New().String()

	svc.On("DeleteTicketType", mocktestify.Anything, ticketTypeID, organiserID).
		Return(response.ErrNotFound)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			withChiParam(
				httptest.NewRequest(http.MethodDelete, "/api/v1/events/"+eventID+"/ticket-types/"+ticketTypeID, nil),
				"eventID", eventID,
			),
			"ticketTypeID", ticketTypeID,
		),
		organiserID,
	)

	h.Delete(w, r)

	assert.Equal(t, http.StatusNotFound, w.Code)
	svc.AssertExpectations(t)
}

func TestDeleteTicketTypeHandler_Forbidden(t *testing.T) {
	svc := new(mock.TicketTypeService)
	h := handler.NewTicketTypeHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()
	ticketTypeID := uuid.New().String()

	svc.On("DeleteTicketType", mocktestify.Anything, ticketTypeID, organiserID).
		Return(response.ErrForbidden)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			withChiParam(
				httptest.NewRequest(http.MethodDelete, "/api/v1/events/"+eventID+"/ticket-types/"+ticketTypeID, nil),
				"eventID", eventID,
			),
			"ticketTypeID", ticketTypeID,
		),
		organiserID,
	)

	h.Delete(w, r)

	assert.Equal(t, http.StatusForbidden, w.Code)
	svc.AssertExpectations(t)
}
