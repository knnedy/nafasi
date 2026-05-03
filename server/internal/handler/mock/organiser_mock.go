package mock

import (
	"context"

	"github.com/knnedy/nafasi/internal/repository"
	"github.com/stretchr/testify/mock"
)

type OrganiserService struct {
	mock.Mock
}

func (m *OrganiserService) GetEventsByOrganiser(ctx context.Context, organiserID string) ([]repository.Event, error) {
	args := m.Called(ctx, organiserID)
	return args.Get(0).([]repository.Event), args.Error(1)
}

func (m *OrganiserService) GetTicketTypesByEvent(ctx context.Context, organiserID, eventID string) ([]repository.TicketType, error) {
	args := m.Called(ctx, organiserID, eventID)
	return args.Get(0).([]repository.TicketType), args.Error(1)
}

func (m *OrganiserService) GetTicketTypeSalesByEvent(ctx context.Context, organiserID, eventID string) ([]repository.GetTicketTypeSalesByEventRow, error) {
	args := m.Called(ctx, organiserID, eventID)
	return args.Get(0).([]repository.GetTicketTypeSalesByEventRow), args.Error(1)
}

func (m *OrganiserService) GetTotalTicketsSold(ctx context.Context, organiserID, eventID string) (int64, error) {
	args := m.Called(ctx, organiserID, eventID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *OrganiserService) GetOrdersByEvent(ctx context.Context, organiserID, eventID string, limit, offset int32) ([]repository.Order, error) {
	args := m.Called(ctx, organiserID, eventID, limit, offset)
	return args.Get(0).([]repository.Order), args.Error(1)
}

func (m *OrganiserService) GetOrdersByEventAndStatus(ctx context.Context, organiserID, eventID string, status repository.OrderStatus, limit, offset int32) ([]repository.Order, error) {
	args := m.Called(ctx, organiserID, eventID, status, limit, offset)
	return args.Get(0).([]repository.Order), args.Error(1)
}

func (m *OrganiserService) GetRecentEventOrders(ctx context.Context, organiserID, eventID string, limit int32) ([]repository.Order, error) {
	args := m.Called(ctx, organiserID, eventID, limit)
	return args.Get(0).([]repository.Order), args.Error(1)
}

func (m *OrganiserService) GetEventRevenue(ctx context.Context, organiserID, eventID string) (int64, error) {
	args := m.Called(ctx, organiserID, eventID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *OrganiserService) GetEventOrdersCount(ctx context.Context, organiserID, eventID string) (int64, error) {
	args := m.Called(ctx, organiserID, eventID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *OrganiserService) GetEventCheckedInCount(ctx context.Context, organiserID, eventID string) (int64, error) {
	args := m.Called(ctx, organiserID, eventID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *OrganiserService) GetEventOrderStatusBreakdown(ctx context.Context, organiserID, eventID string) ([]repository.GetEventOrderStatusBreakdownRow, error) {
	args := m.Called(ctx, organiserID, eventID)
	return args.Get(0).([]repository.GetEventOrderStatusBreakdownRow), args.Error(1)
}

func (m *OrganiserService) GetEventTicketsSold(ctx context.Context, organiserID, eventID string) (int64, error) {
	args := m.Called(ctx, organiserID, eventID)
	return args.Get(0).(int64), args.Error(1)
}
