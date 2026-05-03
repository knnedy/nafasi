package handler_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/handler"
	"github.com/knnedy/nafasi/internal/handler/mock"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/stretchr/testify/assert"
	mocktestify "github.com/stretchr/testify/mock"
)

// GetEventsByOrganiser
func TestGetEventsByOrganiserHandler_Success(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	organiserID := uuid.New().String()

	svc.On("GetEventsByOrganiser", mocktestify.Anything, organiserID).
		Return([]repository.Event{
			{
				ID: pgtype.UUID{Bytes: uuid.New(), Valid: true},
			},
		}, nil)

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodGet, "/organiser/events", nil), organiserID)

	h.GetEventsByOrganiser(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestGetEventsByOrganiserHandler_Unauthorized(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/organiser/events", nil)

	h.GetEventsByOrganiser(w, r)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// GetTicketTypesByEvent
func TestGetTicketTypesByEventHandler_Success(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetTicketTypesByEvent", mocktestify.Anything, organiserID, eventID).
		Return([]repository.TicketType{
			{
				ID:   pgtype.UUID{Bytes: uuid.New(), Valid: true},
				Name: "VIP",
			},
		}, nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(httptest.NewRequest(http.MethodGet, "/organiser/events/"+eventID+"/ticket-types", nil), "eventID", eventID),
		organiserID,
	)

	h.GetTicketTypesByEvent(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestGetTicketTypesByEventHandler_NotFound(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	organiserID := uuid.New().String()

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodGet, "/organiser/events/", nil), organiserID)

	h.GetTicketTypesByEvent(w, r)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// GetTicketTypeSalesByEvent
func TestGetTicketTypeSalesByEventHandler_Success(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetTicketTypeSalesByEvent", mocktestify.Anything, organiserID, eventID).
		Return([]repository.GetTicketTypeSalesByEventRow{
			{
				ID:           pgtype.UUID{Bytes: uuid.New(), Valid: true},
				Name:         "VIP",
				Revenue:      1000,
				Quantity:     100,
				QuantitySold: 50,
			},
		}, nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(httptest.NewRequest(http.MethodGet, "/organiser/events/"+eventID+"/ticket-types/sales", nil), "eventID", eventID),
		organiserID,
	)

	h.GetTicketTypeSalesByEvent(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

// GetTotalTicketsSold
func TestGetTotalTicketsSoldHandler_Success(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetTotalTicketsSold", mocktestify.Anything, organiserID, eventID).
		Return(int64(50), nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(httptest.NewRequest(http.MethodGet, "/organiser/events/"+eventID+"/tickets-sold", nil), "eventID", eventID),
		organiserID,
	)

	h.GetTotalTicketsSold(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

// GetOrdersByEvent
func TestGetOrdersByEventHandler_Success(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetOrdersByEvent", mocktestify.Anything, organiserID, eventID, int32(20), int32(0)).
		Return([]repository.Order{
			{
				ID: pgtype.UUID{Bytes: uuid.New(), Valid: true},
			},
		}, nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(httptest.NewRequest(http.MethodGet, "/organiser/events/"+eventID+"/orders", nil), "eventID", eventID),
		organiserID,
	)

	h.GetOrdersByEvent(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

// GetOrdersByEventAndStatus
func TestGetOrdersByEventAndStatusHandler_Success(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetOrdersByEventAndStatus", mocktestify.Anything, organiserID, eventID, repository.OrderStatus("PAID"), int32(20), int32(0)).
		Return([]repository.Order{}, nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(httptest.NewRequest(http.MethodGet, "/organiser/events/"+eventID+"/orders/status?status=PAID", nil), "eventID", eventID),
		organiserID,
	)

	h.GetOrdersByEventAndStatus(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestGetOrdersByEventAndStatusHandler_InvalidStatus(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(httptest.NewRequest(http.MethodGet, "/organiser/events/"+eventID+"/orders/status", nil), "eventID", eventID),
		organiserID,
	)

	h.GetOrdersByEventAndStatus(w, r)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// GetRecentEventOrders
func TestGetRecentEventOrdersHandler_Success(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetRecentEventOrders", mocktestify.Anything, organiserID, eventID, int32(20)).
		Return([]repository.Order{}, nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(httptest.NewRequest(http.MethodGet, "/organiser/events/"+eventID+"/orders/recent", nil), "eventID", eventID),
		organiserID,
	)

	h.GetRecentEventOrders(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

// GetEventRevenue
func TestGetEventRevenueHandler_Success(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetEventRevenue", mocktestify.Anything, organiserID, eventID).
		Return(int64(1000), nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(httptest.NewRequest(http.MethodGet, "/organiser/events/"+eventID+"/revenue", nil), "eventID", eventID),
		organiserID,
	)

	h.GetEventRevenue(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

// GetEventOrdersCount
func TestGetEventOrdersCountHandler_Success(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetEventOrdersCount", mocktestify.Anything, organiserID, eventID).
		Return(int64(10), nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(httptest.NewRequest(http.MethodGet, "/organiser/events/"+eventID+"/orders/count", nil), "eventID", eventID),
		organiserID,
	)

	h.GetEventOrdersCount(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

// GetEventCheckedInCount
func TestGetEventCheckedInCountHandler_Success(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetEventCheckedInCount", mocktestify.Anything, organiserID, eventID).
		Return(int64(5), nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(httptest.NewRequest(http.MethodGet, "/organiser/events/"+eventID+"/checkin/count", nil), "eventID", eventID),
		organiserID,
	)

	h.GetEventCheckedInCount(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

// GetEventOrderStatusBreakdown
func TestGetEventOrderStatusBreakdownHandler_Success(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetEventOrderStatusBreakdown", mocktestify.Anything, organiserID, eventID).
		Return([]repository.GetEventOrderStatusBreakdownRow{
			{Status: repository.OrderStatus("PAID"), Count: 5},
		}, nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(httptest.NewRequest(http.MethodGet, "/organiser/events/"+eventID+"/orders/breakdown", nil), "eventID", eventID),
		organiserID,
	)

	h.GetEventOrderStatusBreakdown(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

// GetEventTicketsSold
func TestGetEventTicketsSoldHandler_Success(t *testing.T) {
	svc := new(mock.OrganiserService)
	h := handler.NewOrganiserHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetEventTicketsSold", mocktestify.Anything, organiserID, eventID).
		Return(int64(20), nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(httptest.NewRequest(http.MethodGet, "/organiser/events/"+eventID+"/tickets-sold/paid", nil), "eventID", eventID),
		organiserID,
	)

	h.GetEventTicketsSold(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}
