package mock

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/mock"
)

type CheckInQueries struct {
	mock.Mock
}

var _ service.CheckInQuerier = (*CheckInQueries)(nil)

func (m *CheckInQueries) GetOrderByQRCode(ctx context.Context, qrCode pgtype.Text) (repository.Order, error) {
	args := m.Called(ctx, qrCode)
	return args.Get(0).(repository.Order), args.Error(1)
}

func (m *CheckInQueries) GetEventById(ctx context.Context, id pgtype.UUID) (repository.Event, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *CheckInQueries) CheckInOrder(ctx context.Context, id pgtype.UUID) (repository.Order, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.Order), args.Error(1)
}

func (m *CheckInQueries) GetCheckedInOrders(ctx context.Context, eventID pgtype.UUID) ([]repository.Order, error) {
	args := m.Called(ctx, eventID)
	return args.Get(0).([]repository.Order), args.Error(1)
}
