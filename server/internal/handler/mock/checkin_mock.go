package mock

import (
	"context"

	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/mock"
)

type CheckInService struct {
	mock.Mock
}

func (m *CheckInService) CheckIn(ctx context.Context, organiserID string, qrCode string) (*service.CheckInResult, error) {
	args := m.Called(ctx, organiserID, qrCode)
	return args.Get(0).(*service.CheckInResult), args.Error(1)
}

func (m *CheckInService) GetCheckedInOrders(ctx context.Context, organiserID string, eventID string) ([]repository.Order, error) {
	args := m.Called(ctx, organiserID, eventID)
	return args.Get(0).([]repository.Order), args.Error(1)
}
