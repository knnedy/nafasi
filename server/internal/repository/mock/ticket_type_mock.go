package mock

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/mock"
)

type TicketTypeQueries struct {
	mock.Mock
}

var _ service.TicketTypeQuerier = (*TicketTypeQueries)(nil)

func (m *TicketTypeQueries) CreateTicketType(ctx context.Context, arg repository.CreateTicketTypeParams) (repository.TicketType, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.TicketType), args.Error(1)
}

func (m *TicketTypeQueries) GetTicketTypeById(ctx context.Context, id pgtype.UUID) (repository.TicketType, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.TicketType), args.Error(1)
}

func (m *TicketTypeQueries) GetTicketTypesByEvent(ctx context.Context, eventID pgtype.UUID) ([]repository.TicketType, error) {
	args := m.Called(ctx, eventID)
	return args.Get(0).([]repository.TicketType), args.Error(1)
}

func (m *TicketTypeQueries) GetAvailableTicketTypes(ctx context.Context, eventID pgtype.UUID) ([]repository.TicketType, error) {
	args := m.Called(ctx, eventID)
	return args.Get(0).([]repository.TicketType), args.Error(1)
}

func (m *TicketTypeQueries) GetEventById(ctx context.Context, id pgtype.UUID) (repository.Event, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *TicketTypeQueries) UpdateTicketType(ctx context.Context, arg repository.UpdateTicketTypeParams) (repository.TicketType, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.TicketType), args.Error(1)
}

func (m *TicketTypeQueries) DeleteTicketType(ctx context.Context, id pgtype.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}
