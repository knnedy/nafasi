package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
)

type EventService struct {
	db       *repository.Queries
	validate *validator.Validate
	trans    ut.Translator
}

func NewEventService(db *repository.Queries) *EventService {
	validate, trans := newValidator()
	return &EventService{
		db:       db,
		validate: validate,
		trans:    trans,
	}
}

type CreateEventInput struct {
	Title       string `json:"title"       validate:"required,min=3,max=255"`
	Description string `json:"description" validate:"omitempty"`
	Location    string `json:"location"    validate:"omitempty"`
	Venue       string `json:"venue"       validate:"omitempty"`
	StartsAt    string `json:"starts_at"   validate:"required"`
	EndsAt      string `json:"ends_at"     validate:"required"`
	IsOnline    bool   `json:"is_online"`
	OnlineURL   string `json:"online_url"  validate:"omitempty,url"`
}

type UpdateEventInput struct {
	Title       string `json:"title"       validate:"required,min=3,max=255"`
	Description string `json:"description" validate:"omitempty"`
	Location    string `json:"location"    validate:"omitempty"`
	Venue       string `json:"venue"       validate:"omitempty"`
	StartsAt    string `json:"starts_at"   validate:"required"`
	EndsAt      string `json:"ends_at"     validate:"required"`
	IsOnline    bool   `json:"is_online"`
	OnlineURL   string `json:"online_url"  validate:"omitempty,url"`
}

type UpdateEventStatusInput struct {
	Status string `json:"status" validate:"required,oneof=DRAFT PUBLISHED CANCELLED COMPLETED"`
}

func generateSlug(title string) string {
	slug := strings.ToLower(title)
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = fmt.Sprintf("%s-%d", slug, time.Now().Unix())
	return slug
}

func parseTime(t string) (pgtype.Timestamp, error) {
	parsed, err := time.Parse(time.RFC3339, t)
	if err != nil {
		return pgtype.Timestamp{}, fmt.Errorf("invalid time format, use RFC3339")
	}
	return pgtype.Timestamp{Time: parsed, Valid: true}, nil
}

func (s *EventService) CreateEvent(ctx context.Context, organiserID string, input CreateEventInput) (repository.Event, error) {
	if err := s.validate.Struct(input); err != nil {
		return repository.Event{}, formatValidationError(err, s.trans)
	}

	// parse organiser ID
	parsedID, err := uuid.Parse(organiserID)
	if err != nil {
		return repository.Event{}, response.ErrNotFound
	}

	// parse times
	startsAt, err := parseTime(input.StartsAt)
	if err != nil {
		return repository.Event{}, response.ErrInvalidInput
	}
	endsAt, err := parseTime(input.EndsAt)
	if err != nil {
		return repository.Event{}, response.ErrInvalidInput
	}

	// ends_at must be after starts_at
	if endsAt.Time.Before(startsAt.Time) {
		return repository.Event{}, response.ErrInvalidInput
	}

	// starts_at must be in the future
	if startsAt.Time.Before(time.Now()) {
		return repository.Event{}, response.ErrInvalidInput
	}

	// online event must have online_url
	if input.IsOnline && input.OnlineURL == "" {
		return repository.Event{}, response.ErrInvalidInput
	}

	event, err := s.db.CreateEvent(ctx, repository.CreateEventParams{
		OrganiserID: pgtype.UUID{Bytes: parsedID, Valid: true},
		Title:       input.Title,
		Slug:        generateSlug(input.Title),
		Description: pgtype.Text{String: input.Description, Valid: input.Description != ""},
		Location:    pgtype.Text{String: input.Location, Valid: input.Location != ""},
		Venue:       pgtype.Text{String: input.Venue, Valid: input.Venue != ""},
		StartsAt:    startsAt,
		EndsAt:      endsAt,
		Status:      repository.EventStatusDRAFT,
		IsOnline:    input.IsOnline,
		OnlineUrl:   pgtype.Text{String: input.OnlineURL, Valid: input.OnlineURL != ""},
	})
	if err != nil {
		return repository.Event{}, response.ErrDatabase
	}

	return event, nil
}

func (s *EventService) GetEventByID(ctx context.Context, eventID string) (repository.Event, error) {
	parsedID, err := uuid.Parse(eventID)
	if err != nil {
		return repository.Event{}, response.ErrNotFound
	}

	event, err := s.db.GetEventById(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		return repository.Event{}, response.ErrNotFound
	}

	return event, nil
}

func (s *EventService) GetEventBySlug(ctx context.Context, slug string) (repository.Event, error) {
	event, err := s.db.GetEventBySlug(ctx, slug)
	if err != nil {
		return repository.Event{}, response.ErrNotFound
	}

	return event, nil
}

func (s *EventService) GetEventsByOrganiser(ctx context.Context, organiserID string) ([]repository.Event, error) {
	parsedID, err := uuid.Parse(organiserID)
	if err != nil {
		return nil, response.ErrNotFound
	}

	events, err := s.db.GetEventsByOrganiser(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return events, nil
}

func (s *EventService) GetPublishedEvents(ctx context.Context) ([]repository.Event, error) {
	events, err := s.db.GetPublishedEvents(ctx)
	if err != nil {
		return nil, response.ErrDatabase
	}

	return events, nil
}

func (s *EventService) GetUpcomingEvents(ctx context.Context) ([]repository.Event, error) {
	events, err := s.db.GetUpcomingEvents(ctx)
	if err != nil {
		return nil, response.ErrDatabase
	}

	return events, nil
}

func (s *EventService) UpdateEvent(ctx context.Context, eventID, organiserID string, input UpdateEventInput) (repository.Event, error) {
	if err := s.validate.Struct(input); err != nil {
		return repository.Event{}, formatValidationError(err, s.trans)
	}

	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return repository.Event{}, response.ErrNotFound
	}

	// verify event exists and belongs to organiser
	event, err := s.db.GetEventById(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true})
	if err != nil {
		return repository.Event{}, response.ErrNotFound
	}

	parsedOrganiserID, err := uuid.Parse(organiserID)
	if err != nil {
		return repository.Event{}, response.ErrNotFound
	}

	if event.OrganiserID.Bytes != parsedOrganiserID {
		return repository.Event{}, response.ErrForbidden
	}

	// parse times
	startsAt, err := parseTime(input.StartsAt)
	if err != nil {
		return repository.Event{}, response.ErrInvalidInput
	}
	endsAt, err := parseTime(input.EndsAt)
	if err != nil {
		return repository.Event{}, response.ErrInvalidInput
	}

	if endsAt.Time.Before(startsAt.Time) {
		return repository.Event{}, response.ErrInvalidInput
	}

	if input.IsOnline && input.OnlineURL == "" {
		return repository.Event{}, response.ErrInvalidInput
	}

	updated, err := s.db.UpdateEvent(ctx, repository.UpdateEventParams{
		ID:          pgtype.UUID{Bytes: parsedEventID, Valid: true},
		Title:       input.Title,
		Slug:        generateSlug(input.Title),
		Description: pgtype.Text{String: input.Description, Valid: input.Description != ""},
		Location:    pgtype.Text{String: input.Location, Valid: input.Location != ""},
		Venue:       pgtype.Text{String: input.Venue, Valid: input.Venue != ""},
		StartsAt:    startsAt,
		EndsAt:      endsAt,
		IsOnline:    input.IsOnline,
		OnlineUrl:   pgtype.Text{String: input.OnlineURL, Valid: input.OnlineURL != ""},
	})
	if err != nil {
		return repository.Event{}, response.ErrDatabase
	}

	return updated, nil
}

func (s *EventService) UpdateEventStatus(ctx context.Context, eventID, organiserID string, input UpdateEventStatusInput) (repository.Event, error) {
	if err := s.validate.Struct(input); err != nil {
		return repository.Event{}, formatValidationError(err, s.trans)
	}

	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return repository.Event{}, response.ErrNotFound
	}

	// verify event exists and belongs to organiser
	event, err := s.db.GetEventById(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true})
	if err != nil {
		return repository.Event{}, response.ErrNotFound
	}

	parsedOrganiserID, err := uuid.Parse(organiserID)
	if err != nil {
		return repository.Event{}, response.ErrNotFound
	}

	if event.OrganiserID.Bytes != parsedOrganiserID {
		return repository.Event{}, response.ErrForbidden
	}

	updated, err := s.db.UpdateEventStatus(ctx, repository.UpdateEventStatusParams{
		ID:     pgtype.UUID{Bytes: parsedEventID, Valid: true},
		Status: repository.EventStatus(input.Status),
	})
	if err != nil {
		return repository.Event{}, response.ErrDatabase
	}

	return updated, nil
}

func (s *EventService) DeleteEvent(ctx context.Context, eventID, organiserID string) error {
	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return response.ErrNotFound
	}

	// verify event exists and belongs to organiser
	event, err := s.db.GetEventById(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true})
	if err != nil {
		return response.ErrNotFound
	}

	parsedOrganiserID, err := uuid.Parse(organiserID)
	if err != nil {
		return response.ErrNotFound
	}

	if event.OrganiserID.Bytes != parsedOrganiserID {
		return response.ErrForbidden
	}

	if err := s.db.DeleteEvent(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true}); err != nil {
		return response.ErrDatabase
	}

	return nil
}
