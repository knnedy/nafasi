package mock

import (
	"context"

	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/mock"
)

type EventService struct {
	mock.Mock
}

func (m *EventService) CreateEvent(ctx context.Context, organiserID string, input service.CreateEventInput) (repository.Event, error) {
	args := m.Called(ctx, organiserID, input)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *EventService) GetEventByID(ctx context.Context, eventID string) (repository.Event, error) {
	args := m.Called(ctx, eventID)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *EventService) GetEventBySlug(ctx context.Context, slug string) (repository.Event, error) {
	args := m.Called(ctx, slug)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *EventService) GetEventsByOrganiser(ctx context.Context, organiserID string) ([]repository.Event, error) {
	args := m.Called(ctx, organiserID)
	return args.Get(0).([]repository.Event), args.Error(1)
}

func (m *EventService) GetPublishedEvents(ctx context.Context, limit int32, offset int32) ([]repository.Event, error) {
	args := m.Called(ctx, limit, offset)
	return args.Get(0).([]repository.Event), args.Error(1)
}

func (m *EventService) GetUpcomingEvents(ctx context.Context, limit int32, offset int32) ([]repository.Event, error) {
	args := m.Called(ctx, limit, offset)
	return args.Get(0).([]repository.Event), args.Error(1)
}

func (m *EventService) UpdateEvent(ctx context.Context, eventID string, organiserID string, input service.UpdateEventInput) (repository.Event, error) {
	args := m.Called(ctx, eventID, organiserID, input)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *EventService) UpdateEventStatus(ctx context.Context, eventID string, organiserID string, input service.UpdateEventStatusInput) (repository.Event, error) {
	args := m.Called(ctx, eventID, organiserID, input)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *EventService) CancelEvent(ctx context.Context, eventID string, organiserID string) (repository.Event, error) {
	args := m.Called(ctx, eventID, organiserID)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *EventService) DeleteEvent(ctx context.Context, eventID string, organiserID string) (repository.Event, error) {
	args := m.Called(ctx, eventID, organiserID)
	return args.Get(0).(repository.Event), args.Error(1)
}
