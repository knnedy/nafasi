package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/repository/mock"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/assert"
	mocktestify "github.com/stretchr/testify/mock"
)

func newTestTicketTypeService(db *mock.TicketTypeQueries) *service.TicketTypeService {
	return service.NewTicketTypeService(db)
}

func makeTicketTypeID() pgtype.UUID {
	return pgtype.UUID{Bytes: uuid.New(), Valid: true}
}

func validCreateTicketTypeInput() service.CreateTicketTypeInput {
	return service.CreateTicketTypeInput{
		Name:     "VIP",
		Price:    "5000.00",
		Quantity: 100,
		IsFree:   false,
	}
}

func makeTicketType(eventID pgtype.UUID) repository.TicketType {
	return repository.TicketType{
		ID:       makeTicketTypeID(),
		EventID:  eventID,
		Name:     "VIP",
		Price:    500000,
		Currency: "KES",
		Quantity: 100,
		IsFree:   false,
	}
}

func makeEventWithOrganiser(organiserID string) repository.Event {
	parsedID, _ := uuid.Parse(organiserID)
	return repository.Event{
		ID:          makeEventID(),
		OrganiserID: pgtype.UUID{Bytes: parsedID, Valid: true},
		StartsAt:    pgtype.Timestamp{Valid: false},
	}
}

// CreateTicketType
func TestCreateTicketType_Success(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	organiserID := makeOrganiserID()
	eventID := makeEventID()

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(makeEventWithOrganiser(organiserID), nil)

	db.On("CreateTicketType", mocktestify.Anything, mocktestify.MatchedBy(func(p repository.CreateTicketTypeParams) bool {
		return p.Name == "VIP" && p.Price == 500000 && p.Quantity == 100
	})).Return(makeTicketType(eventID), nil)

	ticketType, err := svc.CreateTicketType(context.Background(), uuid.UUID(eventID.Bytes).String(), organiserID, validCreateTicketTypeInput())

	assert.NoError(t, err)
	assert.Equal(t, "VIP", ticketType.Name)
	assert.Equal(t, int64(500000), ticketType.Price)
	db.AssertExpectations(t)
}

func TestCreateTicketType_InvalidEventID(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	_, err := svc.CreateTicketType(context.Background(), "not-a-uuid", makeOrganiserID(), validCreateTicketTypeInput())

	assert.ErrorIs(t, err, response.ErrNotFound)
}

func TestCreateTicketType_EventNotFound(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	eventID := makeEventID()

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(repository.Event{}, errors.New("not found"))

	_, err := svc.CreateTicketType(context.Background(), uuid.UUID(eventID.Bytes).String(), makeOrganiserID(), validCreateTicketTypeInput())

	assert.ErrorIs(t, err, response.ErrNotFound)
	db.AssertExpectations(t)
}

func TestCreateTicketType_NotOwner(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	eventID := makeEventID()
	realOwner := makeOrganiserID()

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(makeEventWithOrganiser(realOwner), nil)

	_, err := svc.CreateTicketType(context.Background(), uuid.UUID(eventID.Bytes).String(), makeOrganiserID(), validCreateTicketTypeInput())

	assert.ErrorIs(t, err, response.ErrNotFound)
	db.AssertExpectations(t)
}

func TestCreateTicketType_FreeTicketWithPrice(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	organiserID := makeOrganiserID()
	eventID := makeEventID()

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(makeEventWithOrganiser(organiserID), nil)

	db.On("CreateTicketType", mocktestify.Anything, mocktestify.MatchedBy(func(p repository.CreateTicketTypeParams) bool {
		return p.IsFree && p.Price == 0
	})).Return(repository.TicketType{
		EventID:  eventID,
		Name:     "Free Entry",
		Price:    0,
		IsFree:   true,
		Quantity: 50,
	}, nil)

	// even though price is set, IsFree should zero it out
	input := service.CreateTicketTypeInput{
		Name:     "Free Entry",
		Price:    "5000.00",
		Quantity: 50,
		IsFree:   true,
	}

	ticketType, err := svc.CreateTicketType(context.Background(), uuid.UUID(eventID.Bytes).String(), organiserID, input)

	assert.NoError(t, err)
	assert.Equal(t, int64(0), ticketType.Price)
	assert.True(t, ticketType.IsFree)
	db.AssertExpectations(t)
}

func TestCreateTicketType_PaidWithZeroPrice(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	organiserID := makeOrganiserID()
	eventID := makeEventID()

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(makeEventWithOrganiser(organiserID), nil)

	input := service.CreateTicketTypeInput{
		Name:     "Regular",
		Price:    "0",
		Quantity: 100,
		IsFree:   false,
	}

	_, err := svc.CreateTicketType(context.Background(), uuid.UUID(eventID.Bytes).String(), organiserID, input)

	assert.ErrorIs(t, err, response.ErrInvalidInput)
	db.AssertExpectations(t)
}

func TestCreateTicketType_InvalidPriceFormat(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	organiserID := makeOrganiserID()
	eventID := makeEventID()

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(makeEventWithOrganiser(organiserID), nil)

	input := validCreateTicketTypeInput()
	input.Price = "not-a-price"

	_, err := svc.CreateTicketType(context.Background(), uuid.UUID(eventID.Bytes).String(), organiserID, input)

	assert.ErrorIs(t, err, response.ErrInvalidInput)
	db.AssertExpectations(t)
}

func TestCreateTicketType_SaleEndsAfterEventStarts(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	organiserID := makeOrganiserID()
	parsedOrgID, _ := uuid.Parse(organiserID)
	eventID := makeEventID()

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(repository.Event{
			ID:          eventID,
			OrganiserID: pgtype.UUID{Bytes: parsedOrgID, Valid: true},
			StartsAt:    pgtype.Timestamp{Time: mustParseTime("2027-12-01T18:00:00Z"), Valid: true},
		}, nil)

	input := validCreateTicketTypeInput()
	input.SaleEnds = "2027-12-02T00:00:00Z"

	_, err := svc.CreateTicketType(context.Background(), uuid.UUID(eventID.Bytes).String(), organiserID, input)

	assert.ErrorIs(t, err, response.ErrInvalidInput)
	db.AssertExpectations(t)
}

func TestCreateTicketType_DatabaseError(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	organiserID := makeOrganiserID()
	eventID := makeEventID()

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(makeEventWithOrganiser(organiserID), nil)

	db.On("CreateTicketType", mocktestify.Anything, mocktestify.Anything).
		Return(repository.TicketType{}, errors.New("db error"))

	_, err := svc.CreateTicketType(context.Background(), uuid.UUID(eventID.Bytes).String(), organiserID, validCreateTicketTypeInput())

	assert.ErrorIs(t, err, response.ErrDatabase)
	db.AssertExpectations(t)
}

// GetTicketTypeByID
func TestGetTicketTypeByID_Success(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	ticketTypeID := makeTicketTypeID()
	eventID := makeEventID()

	db.On("GetTicketTypeById", mocktestify.Anything, ticketTypeID).
		Return(makeTicketType(eventID), nil)

	ticketType, err := svc.GetTicketTypeByID(context.Background(), uuid.UUID(ticketTypeID.Bytes).String())

	assert.NoError(t, err)
	assert.Equal(t, "VIP", ticketType.Name)
	db.AssertExpectations(t)
}

func TestGetTicketTypeByID_InvalidID(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	_, err := svc.GetTicketTypeByID(context.Background(), "not-a-uuid")

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

func TestGetTicketTypeByID_NotFound(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	ticketTypeID := makeTicketTypeID()

	db.On("GetTicketTypeById", mocktestify.Anything, ticketTypeID).
		Return(repository.TicketType{}, pgx.ErrNoRows)

	_, err := svc.GetTicketTypeByID(context.Background(), uuid.UUID(ticketTypeID.Bytes).String())

	assert.ErrorIs(t, err, response.ErrNotFound)
	db.AssertExpectations(t)
}

// GetTicketTypesByEvent
func TestGetTicketTypesByEvent_Success(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	eventID := makeEventID()

	db.On("GetTicketTypesByEvent", mocktestify.Anything, eventID).
		Return([]repository.TicketType{
			{Name: "VIP"},
			{Name: "Regular"},
		}, nil)

	ticketTypes, err := svc.GetTicketTypesByEvent(context.Background(), uuid.UUID(eventID.Bytes).String())

	assert.NoError(t, err)
	assert.Len(t, ticketTypes, 2)
	db.AssertExpectations(t)
}

func TestGetTicketTypesByEvent_InvalidID(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	_, err := svc.GetTicketTypesByEvent(context.Background(), "not-a-uuid")

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

// UpdateTicketType
func TestUpdateTicketType_Success(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	organiserID := makeOrganiserID()
	ticketTypeID := makeTicketTypeID()
	eventID := makeEventID()

	db.On("GetTicketTypeById", mocktestify.Anything, ticketTypeID).
		Return(makeTicketType(eventID), nil)

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(makeEventWithOrganiser(organiserID), nil)

	db.On("UpdateTicketType", mocktestify.Anything, mocktestify.MatchedBy(func(p repository.UpdateTicketTypeParams) bool {
		return p.Name == "VVIP" && p.Price == 1000000
	})).Return(repository.TicketType{
		ID:       ticketTypeID,
		EventID:  eventID,
		Name:     "VVIP",
		Price:    1000000,
		Currency: "KES",
		Quantity: 50,
	}, nil)

	ticketType, err := svc.UpdateTicketType(context.Background(), uuid.UUID(ticketTypeID.Bytes).String(), organiserID, service.UpdateTicketTypeInput{
		Name:     "VVIP",
		Price:    "10000.00",
		Quantity: 50,
		IsFree:   false,
	})

	assert.NoError(t, err)
	assert.Equal(t, "VVIP", ticketType.Name)
	assert.Equal(t, int64(1000000), ticketType.Price)
	db.AssertExpectations(t)
}

func TestUpdateTicketType_NotOwner(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	ticketTypeID := makeTicketTypeID()
	eventID := makeEventID()
	realOwner := makeOrganiserID()

	db.On("GetTicketTypeById", mocktestify.Anything, ticketTypeID).
		Return(makeTicketType(eventID), nil)

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(makeEventWithOrganiser(realOwner), nil)

	_, err := svc.UpdateTicketType(context.Background(), uuid.UUID(ticketTypeID.Bytes).String(), makeOrganiserID(), service.UpdateTicketTypeInput{
		Name:     "VVIP",
		Price:    "10000.00",
		Quantity: 50,
	})

	assert.ErrorIs(t, err, response.ErrNotFound)
	db.AssertExpectations(t)
}

// DeleteTicketType
func TestDeleteTicketType_Success(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	organiserID := makeOrganiserID()
	ticketTypeID := makeTicketTypeID()
	eventID := makeEventID()

	db.On("GetTicketTypeById", mocktestify.Anything, ticketTypeID).
		Return(makeTicketType(eventID), nil)

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(makeEventWithOrganiser(organiserID), nil)

	db.On("DeleteTicketType", mocktestify.Anything, ticketTypeID).
		Return(nil)

	err := svc.DeleteTicketType(context.Background(), uuid.UUID(ticketTypeID.Bytes).String(), organiserID)

	assert.NoError(t, err)
	db.AssertExpectations(t)
}

func TestDeleteTicketType_NotOwner(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	ticketTypeID := makeTicketTypeID()
	eventID := makeEventID()
	realOwner := makeOrganiserID()

	db.On("GetTicketTypeById", mocktestify.Anything, ticketTypeID).
		Return(makeTicketType(eventID), nil)

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(makeEventWithOrganiser(realOwner), nil)

	err := svc.DeleteTicketType(context.Background(), uuid.UUID(ticketTypeID.Bytes).String(), makeOrganiserID())

	assert.ErrorIs(t, err, response.ErrNotFound)
	db.AssertExpectations(t)
}

func TestDeleteTicketType_NotFound(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	ticketTypeID := makeTicketTypeID()

	db.On("GetTicketTypeById", mocktestify.Anything, ticketTypeID).
		Return(repository.TicketType{}, errors.New("not found"))

	err := svc.DeleteTicketType(context.Background(), uuid.UUID(ticketTypeID.Bytes).String(), makeOrganiserID())

	assert.ErrorIs(t, err, response.ErrNotFound)
	db.AssertExpectations(t)
}

func TestDeleteTicketType_DatabaseError(t *testing.T) {
	db := new(mock.TicketTypeQueries)
	svc := newTestTicketTypeService(db)

	organiserID := makeOrganiserID()
	ticketTypeID := makeTicketTypeID()
	eventID := makeEventID()

	db.On("GetTicketTypeById", mocktestify.Anything, ticketTypeID).
		Return(makeTicketType(eventID), nil)

	db.On("GetEventById", mocktestify.Anything, eventID).
		Return(makeEventWithOrganiser(organiserID), nil)

	db.On("DeleteTicketType", mocktestify.Anything, ticketTypeID).
		Return(errors.New("db error"))

	err := svc.DeleteTicketType(context.Background(), uuid.UUID(ticketTypeID.Bytes).String(), organiserID)

	assert.ErrorIs(t, err, response.ErrDatabase)
	db.AssertExpectations(t)
}

// helpers

func mustParseTime(s string) time.Time {
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		panic(err)
	}
	return t
}
