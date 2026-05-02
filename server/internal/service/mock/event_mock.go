package mock

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/mock"
)

type EventQueries struct {
	mock.Mock
}

var _ service.EventQuerier = (*EventQueries)(nil)

func (m *EventQueries) CreateEvent(ctx context.Context, arg repository.CreateEventParams) (repository.Event, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *EventQueries) GetEventById(ctx context.Context, id pgtype.UUID) (repository.Event, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *EventQueries) GetEventBySlug(ctx context.Context, slug string) (repository.Event, error) {
	args := m.Called(ctx, slug)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *EventQueries) GetEventsByOrganiser(ctx context.Context, organiserID pgtype.UUID) ([]repository.Event, error) {
	args := m.Called(ctx, organiserID)
	return args.Get(0).([]repository.Event), args.Error(1)
}

func (m *EventQueries) PublicGetPublishedEvents(ctx context.Context) ([]repository.Event, error) {
	args := m.Called(ctx)
	return args.Get(0).([]repository.Event), args.Error(1)
}

func (m *EventQueries) PublicGetUpcomingEvents(ctx context.Context) ([]repository.Event, error) {
	args := m.Called(ctx)
	return args.Get(0).([]repository.Event), args.Error(1)
}

func (m *EventQueries) UpdateEvent(ctx context.Context, arg repository.UpdateEventParams) (repository.Event, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *EventQueries) UpdateEventStatus(ctx context.Context, arg repository.UpdateEventStatusParams) (repository.Event, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *EventQueries) CancelEvent(ctx context.Context, id pgtype.UUID) (repository.Event, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *EventQueries) DeleteEvent(ctx context.Context, id pgtype.UUID) (repository.Event, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.Event), args.Error(1)
}
