package service_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/knnedy/nafasi/internal/service/mock"
	"github.com/stretchr/testify/assert"
	mocktestify "github.com/stretchr/testify/mock"
)

func newTestEventService(db *mock.EventQueries) *service.EventService {
	return service.NewEventService(db)
}

func makeEventID() pgtype.UUID {
	return pgtype.UUID{Bytes: uuid.New(), Valid: true}
}

func makeOrganiserID() string {
	return uuid.New().String()
}

func validCreateInput() service.CreateEventInput {
	return service.CreateEventInput{
		Title:       "Afrobeats Nairobi",
		Description: "The biggest afrobeats event in Nairobi",
		Location:    "Carnivore Grounds",
		Venue:       "Main Stage",
		StartsAt:    "2027-12-01T18:00:00Z",
		EndsAt:      "2027-12-01T23:00:00Z",
		IsOnline:    false,
	}
}

func makeEvent(organiserID string) repository.Event {
	parsedID, _ := uuid.Parse(organiserID)
	return repository.Event{
		ID:          makeEventID(),
		OrganiserID: pgtype.UUID{Bytes: parsedID, Valid: true},
		Title:       "Afrobeats Nairobi",
		Slug:        "afrobeats-nairobi-123456",
		Status:      repository.EventStatusDRAFT,
	}
}

// CreateEvent
func TestCreateEvent_Success(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)
	organiserID := makeOrganiserID()

	db.On("CreateEvent", mocktestify.Anything, mocktestify.MatchedBy(func(p repository.CreateEventParams) bool {
		return p.Title == "Afrobeats Nairobi" && p.Status == repository.EventStatusDRAFT
	})).Return(makeEvent(organiserID), nil)

	event, err := svc.CreateEvent(context.Background(), organiserID, validCreateInput())

	assert.NoError(t, err)
	assert.Equal(t, "Afrobeats Nairobi", event.Title)
	assert.Equal(t, repository.EventStatusDRAFT, event.Status)
	db.AssertExpectations(t)
}

func TestCreateEvent_InvalidOrganiserID(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	_, err := svc.CreateEvent(context.Background(), "not-a-uuid", validCreateInput())

	assert.ErrorIs(t, err, response.ErrNotFound)
}

func TestCreateEvent_InvalidTitle(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	input := validCreateInput()
	input.Title = ""

	_, err := svc.CreateEvent(context.Background(), makeOrganiserID(), input)

	assert.Error(t, err)
}

func TestCreateEvent_EndsBeforeStarts(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	input := validCreateInput()
	input.StartsAt = "2027-12-01T23:00:00Z"
	input.EndsAt = "2027-12-01T18:00:00Z"

	_, err := svc.CreateEvent(context.Background(), makeOrganiserID(), input)

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

func TestCreateEvent_StartsInPast(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	input := validCreateInput()
	input.StartsAt = "2020-01-01T18:00:00Z"
	input.EndsAt = "2020-01-01T23:00:00Z"

	_, err := svc.CreateEvent(context.Background(), makeOrganiserID(), input)

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

func TestCreateEvent_OnlineWithoutURL(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	input := validCreateInput()
	input.IsOnline = true
	input.OnlineURL = ""

	_, err := svc.CreateEvent(context.Background(), makeOrganiserID(), input)

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

func TestCreateEvent_DatabaseError(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	db.On("CreateEvent", mocktestify.Anything, mocktestify.Anything).
		Return(repository.Event{}, errors.New("db error"))

	_, err := svc.CreateEvent(context.Background(), makeOrganiserID(), validCreateInput())

	assert.ErrorIs(t, err, response.ErrDatabase)
	db.AssertExpectations(t)
}

// GetEventByID
func TestGetEventByID_Success(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	eventID := makeEventID()

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(repository.Event{
			ID:    eventID,
			Title: "Afrobeats Nairobi",
		}, nil)

	event, err := svc.GetEventByID(context.Background(), uuid.UUID(eventID.Bytes).String())

	assert.NoError(t, err)
	assert.Equal(t, "Afrobeats Nairobi", event.Title)
	db.AssertExpectations(t)
}

func TestGetEventByID_NotFound(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	eventID := makeEventID()
	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(repository.Event{}, pgx.ErrNoRows)

	_, err := svc.GetEventByID(context.Background(), uuid.UUID(eventID.Bytes).String())

	assert.ErrorIs(t, err, response.ErrNotFound)
	db.AssertExpectations(t)
}

func TestGetEventByID_InvalidID(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	_, err := svc.GetEventByID(context.Background(), "not-a-uuid")

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

// GetEventBySlug
func TestGetEventBySlug_Success(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	db.On("GetEventBySlug", mocktestify.Anything, "afrobeats-nairobi-123456").
		Return(repository.Event{
			Title: "Afrobeats Nairobi",
			Slug:  "afrobeats-nairobi-123456",
		}, nil)

	event, err := svc.GetEventBySlug(context.Background(), "afrobeats-nairobi-123456")

	assert.NoError(t, err)
	assert.Equal(t, "afrobeats-nairobi-123456", event.Slug)
	db.AssertExpectations(t)
}

func TestGetEventBySlug_NotFound(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	db.On("GetEventBySlug", mocktestify.Anything, "non-existent-slug").
		Return(repository.Event{}, pgx.ErrNoRows)

	_, err := svc.GetEventBySlug(context.Background(), "non-existent-slug")

	assert.ErrorIs(t, err, response.ErrNotFound)
	db.AssertExpectations(t)
}

// GetEventsByOrganiser
func TestGetEventsByOrganiser_Success(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	organiserID := makeOrganiserID()
	parsedID, _ := uuid.Parse(organiserID)
	pgOrganiserID := pgtype.UUID{Bytes: parsedID, Valid: true}

	db.On("GetEventsByOrganiser", mocktestify.Anything, pgOrganiserID).
		Return([]repository.Event{
			{Title: "Event One"},
			{Title: "Event Two"},
		}, nil)

	events, err := svc.GetEventsByOrganiser(context.Background(), organiserID)

	assert.NoError(t, err)
	assert.Len(t, events, 2)
	db.AssertExpectations(t)
}

func TestGetEventsByOrganiser_InvalidID(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	_, err := svc.GetEventsByOrganiser(context.Background(), "not-a-uuid")

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

// UpdateEvent
func TestUpdateEvent_Success(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	organiserID := makeOrganiserID()
	parsedOrgID, _ := uuid.Parse(organiserID)
	eventID := makeEventID()

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(repository.Event{
			ID:          eventID,
			OrganiserID: pgtype.UUID{Bytes: parsedOrgID, Valid: true},
		}, nil)

	db.On("UpdateEvent", mocktestify.Anything, mocktestify.MatchedBy(func(p repository.UpdateEventParams) bool {
		return p.Title == "Updated Title"
	})).Return(repository.Event{
		ID:    eventID,
		Title: "Updated Title",
	}, nil)

	event, err := svc.UpdateEvent(context.Background(), uuid.UUID(eventID.Bytes).String(), organiserID, service.UpdateEventInput{
		Title:    "Updated Title",
		StartsAt: "2027-12-01T18:00:00Z",
		EndsAt:   "2027-12-01T23:00:00Z",
	})

	assert.NoError(t, err)
	assert.Equal(t, "Updated Title", event.Title)
	db.AssertExpectations(t)
}

func TestUpdateEvent_NotOwner(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	eventID := makeEventID()
	realOwnerID := makeOrganiserID()
	parsedOwnerID, _ := uuid.Parse(realOwnerID)
	differentOrganiserID := makeOrganiserID()

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(repository.Event{
			ID:          eventID,
			OrganiserID: pgtype.UUID{Bytes: parsedOwnerID, Valid: true},
		}, nil)

	_, err := svc.UpdateEvent(context.Background(), uuid.UUID(eventID.Bytes).String(), differentOrganiserID, service.UpdateEventInput{
		Title:    "Updated Title",
		StartsAt: "2027-12-01T18:00:00Z",
		EndsAt:   "2027-12-01T23:00:00Z",
	})

	assert.ErrorIs(t, err, response.ErrForbidden)
	db.AssertExpectations(t)
}

// UpdateEventStatus

func TestUpdateEventStatus_Success(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	organiserID := makeOrganiserID()
	parsedOrgID, _ := uuid.Parse(organiserID)
	eventID := makeEventID()

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(repository.Event{
			ID:          eventID,
			OrganiserID: pgtype.UUID{Bytes: parsedOrgID, Valid: true},
			Status:      repository.EventStatusDRAFT,
		}, nil)

	db.On("UpdateEventStatus", mocktestify.Anything, mocktestify.MatchedBy(func(p repository.UpdateEventStatusParams) bool {
		return p.Status == repository.EventStatusPUBLISHED
	})).Return(repository.Event{
		ID:     eventID,
		Status: repository.EventStatusPUBLISHED,
	}, nil)

	event, err := svc.UpdateEventStatus(context.Background(), uuid.UUID(eventID.Bytes).String(), organiserID, service.UpdateEventStatusInput{
		Status: "PUBLISHED",
	})

	assert.NoError(t, err)
	assert.Equal(t, repository.EventStatusPUBLISHED, event.Status)
	db.AssertExpectations(t)
}

func TestUpdateEventStatus_NotOwner(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	eventID := makeEventID()
	realOwnerID := makeOrganiserID()
	parsedOwnerID, _ := uuid.Parse(realOwnerID)

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(repository.Event{
			ID:          eventID,
			OrganiserID: pgtype.UUID{Bytes: parsedOwnerID, Valid: true},
		}, nil)

	_, err := svc.UpdateEventStatus(context.Background(), uuid.UUID(eventID.Bytes).String(), makeOrganiserID(), service.UpdateEventStatusInput{
		Status: "PUBLISHED",
	})

	assert.ErrorIs(t, err, response.ErrForbidden)
	db.AssertExpectations(t)
}

func TestUpdateEventStatus_InvalidStatus(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	organiserID := makeOrganiserID()
	eventID := makeEventID()

	_, err := svc.UpdateEventStatus(context.Background(), uuid.UUID(eventID.Bytes).String(), organiserID, service.UpdateEventStatusInput{
		Status: "INVALID_STATUS",
	})

	assert.Error(t, err)
	db.AssertExpectations(t)
}

// DeleteEvent
func TestDeleteEvent_Success(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	organiserID := makeOrganiserID()
	parsedOrgID, _ := uuid.Parse(organiserID)
	eventID := makeEventID()

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(repository.Event{
			ID:          eventID,
			OrganiserID: pgtype.UUID{Bytes: parsedOrgID, Valid: true},
		}, nil)

	db.On("DeleteEvent", mocktestify.Anything, eventID).
		Return(nil)

	err := svc.DeleteEvent(context.Background(), uuid.UUID(eventID.Bytes).String(), organiserID)

	assert.NoError(t, err)
	db.AssertExpectations(t)
}

func TestDeleteEvent_NotOwner(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	eventID := makeEventID()
	realOwnerID := makeOrganiserID()
	parsedOwnerID, _ := uuid.Parse(realOwnerID)

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(repository.Event{
			ID:          eventID,
			OrganiserID: pgtype.UUID{Bytes: parsedOwnerID, Valid: true},
		}, nil)

	err := svc.DeleteEvent(context.Background(), uuid.UUID(eventID.Bytes).String(), makeOrganiserID())

	assert.ErrorIs(t, err, response.ErrForbidden)
	db.AssertExpectations(t)
}

func TestDeleteEvent_NotFound(t *testing.T) {
	db := new(mock.EventQueries)
	svc := newTestEventService(db)

	eventID := makeEventID()

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(repository.Event{}, errors.New("not found"))

	err := svc.DeleteEvent(context.Background(), uuid.UUID(eventID.Bytes).String(), makeOrganiserID())

	assert.ErrorIs(t, err, response.ErrNotFound)
	db.AssertExpectations(t)
}
