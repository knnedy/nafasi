package mock

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/mock"
)

type OrganiserQueries struct {
	mock.Mock
}

var _ service.OrganiserQuerier = (*OrganiserQueries)(nil)

func (m *OrganiserQueries) GetEventsByOrganiser(ctx context.Context, organiserID pgtype.UUID) ([]repository.Event, error) {
	args := m.Called(ctx, organiserID)
	return args.Get(0).([]repository.Event), args.Error(1)
}

func (m *OrganiserQueries) GetTicketTypesByEvent(ctx context.Context, id pgtype.UUID) ([]repository.TicketType, error) {
	args := m.Called(ctx, id)
	return args.Get(0).([]repository.TicketType), args.Error(1)
}

func (m *OrganiserQueries) GetTicketTypeSalesByEvent(ctx context.Context, id pgtype.UUID) ([]repository.GetTicketTypeSalesByEventRow, error) {
	args := m.Called(ctx, id)
	return args.Get(0).([]repository.GetTicketTypeSalesByEventRow), args.Error(1)
}

func (m *OrganiserQueries) GetTotalTicketsSold(ctx context.Context, id pgtype.UUID) (int64, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(int64), args.Error(1)
}

func (m *OrganiserQueries) GetOrdersByEvent(ctx context.Context, arg repository.GetOrdersByEventParams) ([]repository.Order, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).([]repository.Order), args.Error(1)
}

func (m *OrganiserQueries) GetOrdersByEventAndStatus(ctx context.Context, arg repository.GetOrdersByEventAndStatusParams) ([]repository.Order, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).([]repository.Order), args.Error(1)
}

func (m *OrganiserQueries) GetRecentEventOrders(ctx context.Context, arg repository.GetRecentEventOrdersParams) ([]repository.Order, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).([]repository.Order), args.Error(1)
}

func (m *OrganiserQueries) GetEventRevenue(ctx context.Context, id pgtype.UUID) (int64, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(int64), args.Error(1)
}

func (m *OrganiserQueries) GetEventOrdersCount(ctx context.Context, id pgtype.UUID) (int64, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(int64), args.Error(1)
}

func (m *OrganiserQueries) GetEventCheckedInCount(ctx context.Context, id pgtype.UUID) (int64, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(int64), args.Error(1)
}

func (m *OrganiserQueries) GetEventOrderStatusBreakdown(ctx context.Context, id pgtype.UUID) ([]repository.GetEventOrderStatusBreakdownRow, error) {
	args := m.Called(ctx, id)
	return args.Get(0).([]repository.GetEventOrderStatusBreakdownRow), args.Error(1)
}

func (m *OrganiserQueries) GetEventTicketsSold(ctx context.Context, id pgtype.UUID) (int64, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(int64), args.Error(1)
}
