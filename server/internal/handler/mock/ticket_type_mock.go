package mock

import (
	"context"

	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/mock"
)

type TicketTypeService struct {
	mock.Mock
}

func (m *TicketTypeService) CreateTicketType(ctx context.Context, eventID, organiserID string, input service.CreateTicketTypeInput) (repository.TicketType, error) {
	args := m.Called(ctx, eventID, organiserID, input)
	return args.Get(0).(repository.TicketType), args.Error(1)
}

func (m *TicketTypeService) GetTicketTypeByID(ctx context.Context, ticketTypeID string) (repository.TicketType, error) {
	args := m.Called(ctx, ticketTypeID)
	return args.Get(0).(repository.TicketType), args.Error(1)
}

func (m *TicketTypeService) GetTicketTypesByEvent(ctx context.Context, eventID string) ([]repository.TicketType, error) {
	args := m.Called(ctx, eventID)
	return args.Get(0).([]repository.TicketType), args.Error(1)
}

func (m *TicketTypeService) GetAvailableTicketTypes(ctx context.Context, eventID string) ([]repository.TicketType, error) {
	args := m.Called(ctx, eventID)
	return args.Get(0).([]repository.TicketType), args.Error(1)
}

func (m *TicketTypeService) UpdateTicketType(ctx context.Context, ticketTypeID, organiserID string, input service.UpdateTicketTypeInput) (repository.TicketType, error) {
	args := m.Called(ctx, ticketTypeID, organiserID, input)
	return args.Get(0).(repository.TicketType), args.Error(1)
}

func (m *TicketTypeService) DeleteTicketType(ctx context.Context, ticketTypeID, organiserID string) error {
	args := m.Called(ctx, ticketTypeID, organiserID)
	return args.Error(0)
}
