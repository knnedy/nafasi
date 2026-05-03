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

// GetEventsByOrganiser
func TestGetEventsByOrganiser_Success(t *testing.T) {
	db := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(db)

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
	db := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(db)

	_, err := svc.GetEventsByOrganiser(context.Background(), "not-a-uuid")

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

func TestGetTicketTypesByEvent(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetTicketTypesByEvent", mocktestify.Anything, pgtype.UUID{Bytes: eventID, Valid: true}).
		Return([]repository.TicketType{{Name: "VIP"}}, nil)

	res, err := svc.GetTicketTypesByEvent(context.Background(), "", eventID.String())

	assert.NoError(t, err)
	assert.Len(t, res, 1)
	mockDB.AssertExpectations(t)
}

func TestGetTicketTypesByEvent_Invalid(t *testing.T) {
	svc := service.NewOrganiserService(new(mock.OrganiserQueries))

	_, err := svc.GetTicketTypesByEvent(context.Background(), "", "bad")

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

func TestGetTicketTypesByEvent_DBError(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetTicketTypesByEvent", mocktestify.Anything, mocktestify.Anything).
		Return([]repository.TicketType{}, errors.New("err"))

	_, err := svc.GetTicketTypesByEvent(context.Background(), "", eventID.String())

	assert.ErrorIs(t, err, response.ErrDatabase)
}

func TestGetTicketTypeSalesByEvent(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetTicketTypeSalesByEvent", mocktestify.Anything, mocktestify.Anything).
		Return([]repository.GetTicketTypeSalesByEventRow{{Name: "VIP"}}, nil)

	res, err := svc.GetTicketTypeSalesByEvent(context.Background(), "", eventID.String())

	assert.NoError(t, err)
	assert.Len(t, res, 1)
	mockDB.AssertExpectations(t)
}

func TestGetTicketTypeSalesByEvent_Invalid(t *testing.T) {
	svc := service.NewOrganiserService(new(mock.OrganiserQueries))

	_, err := svc.GetTicketTypeSalesByEvent(context.Background(), "", "bad")

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

func TestGetTicketTypeSalesByEvent_DBError(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetTicketTypeSalesByEvent", mocktestify.Anything, mocktestify.Anything).
		Return([]repository.GetTicketTypeSalesByEventRow{}, errors.New("err"))

	_, err := svc.GetTicketTypeSalesByEvent(context.Background(), "", eventID.String())

	assert.ErrorIs(t, err, response.ErrDatabase)
}

func TestGetTotalTicketsSold(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetTotalTicketsSold", mocktestify.Anything, mocktestify.Anything).
		Return(int64(10), nil)

	res, err := svc.GetTotalTicketsSold(context.Background(), "", eventID.String())

	assert.NoError(t, err)
	assert.Equal(t, int64(10), res)
	mockDB.AssertExpectations(t)
}

func TestGetTotalTicketsSold_NoRows(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetTotalTicketsSold", mocktestify.Anything, mocktestify.Anything).
		Return(int64(0), pgx.ErrNoRows)

	res, err := svc.GetTotalTicketsSold(context.Background(), "", eventID.String())

	assert.NoError(t, err)
	assert.Equal(t, int64(0), res)
}

func TestGetTotalTicketsSold_DBError(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetTotalTicketsSold", mocktestify.Anything, mocktestify.Anything).
		Return(int64(0), errors.New("err"))

	_, err := svc.GetTotalTicketsSold(context.Background(), "", eventID.String())

	assert.ErrorIs(t, err, response.ErrDatabase)
}

func TestGetOrdersByEvent(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetOrdersByEvent", mocktestify.Anything, mocktestify.Anything).
		Return([]repository.Order{{}}, nil)

	res, err := svc.GetOrdersByEvent(context.Background(), "", eventID.String(), 10, 0)

	assert.NoError(t, err)
	assert.Len(t, res, 1)
}

func TestGetOrdersByEvent_Invalid(t *testing.T) {
	svc := service.NewOrganiserService(new(mock.OrganiserQueries))

	_, err := svc.GetOrdersByEvent(context.Background(), "", "bad", 10, 0)

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

func TestGetOrdersByEvent_DBError(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetOrdersByEvent", mocktestify.Anything, mocktestify.Anything).
		Return([]repository.Order{}, errors.New("err"))

	_, err := svc.GetOrdersByEvent(context.Background(), "", eventID.String(), 10, 0)

	assert.ErrorIs(t, err, response.ErrDatabase)
}

func TestGetOrdersByEventAndStatus(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetOrdersByEventAndStatus", mocktestify.Anything, mocktestify.Anything).
		Return([]repository.Order{{}}, nil)

	res, err := svc.GetOrdersByEventAndStatus(context.Background(), "", eventID.String(), repository.OrderStatus("PAID"), 10, 0)

	assert.NoError(t, err)
	assert.Len(t, res, 1)
}

func TestGetRecentEventOrders(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetRecentEventOrders", mocktestify.Anything, mocktestify.Anything).
		Return([]repository.Order{{}}, nil)

	res, err := svc.GetRecentEventOrders(context.Background(), "", eventID.String(), 5)

	assert.NoError(t, err)
	assert.Len(t, res, 1)
}

func TestGetEventRevenue(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetEventRevenue", mocktestify.Anything, mocktestify.Anything).
		Return(int64(1000), nil)

	res, err := svc.GetEventRevenue(context.Background(), "", eventID.String())

	assert.NoError(t, err)
	assert.Equal(t, int64(1000), res)
}

func TestGetEventRevenue_NoRows(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetEventRevenue", mocktestify.Anything, mocktestify.Anything).
		Return(int64(0), pgx.ErrNoRows)

	res, err := svc.GetEventRevenue(context.Background(), "", eventID.String())

	assert.NoError(t, err)
	assert.Equal(t, int64(0), res)
}

func TestGetEventOrdersCount(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetEventOrdersCount", mocktestify.Anything, mocktestify.Anything).
		Return(int64(5), nil)

	res, err := svc.GetEventOrdersCount(context.Background(), "", eventID.String())

	assert.NoError(t, err)
	assert.Equal(t, int64(5), res)
}

func TestGetEventCheckedInCount(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetEventCheckedInCount", mocktestify.Anything, mocktestify.Anything).
		Return(int64(3), nil)

	res, err := svc.GetEventCheckedInCount(context.Background(), "", eventID.String())

	assert.NoError(t, err)
	assert.Equal(t, int64(3), res)
}

func TestGetEventOrderStatusBreakdown(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetEventOrderStatusBreakdown", mocktestify.Anything, mocktestify.Anything).
		Return([]repository.GetEventOrderStatusBreakdownRow{
			{Status: repository.OrderStatus("PAID"), Count: 2},
		}, nil)

	res, err := svc.GetEventOrderStatusBreakdown(context.Background(), "", eventID.String())

	assert.NoError(t, err)
	assert.Len(t, res, 1)
}

func TestGetEventTicketsSold(t *testing.T) {
	mockDB := new(mock.OrganiserQueries)
	svc := service.NewOrganiserService(mockDB)

	eventID := uuid.New()

	mockDB.On("GetEventTicketsSold", mocktestify.Anything, mocktestify.Anything).
		Return(int64(20), nil)

	res, err := svc.GetEventTicketsSold(context.Background(), "", eventID.String())

	assert.NoError(t, err)
	assert.Equal(t, int64(20), res)
}
