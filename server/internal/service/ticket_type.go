package service

import (
	"context"
	"errors"
	"strconv"
	"strings"

	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
)

type TicketTypeService struct {
	db       *repository.Queries
	validate *validator.Validate
	trans    ut.Translator
}

func NewTicketTypeService(db *repository.Queries) *TicketTypeService {
	validate, trans := newValidator()
	return &TicketTypeService{
		db:       db,
		validate: validate,
		trans:    trans,
	}
}

func parsePriceToCents(priceStr string) (int64, error) {
	parts := strings.Split(priceStr, ".")

	if len(parts) == 1 {
		whole, err := strconv.ParseInt(parts[0], 10, 64)
		if err != nil {
			return 0, err
		}
		return whole * 100, nil
	}

	if len(parts) == 2 {
		whole, err := strconv.ParseInt(parts[0], 10, 64)
		if err != nil {
			return 0, err
		}

		frac := parts[1]
		if len(frac) == 1 {
			frac += "0"
		}
		if len(frac) > 2 {
			return 0, errors.New("invalid price precision")
		}

		decimal, err := strconv.ParseInt(frac, 10, 64)
		if err != nil {
			return 0, err
		}

		return whole*100 + decimal, nil
	}

	return 0, errors.New("invalid price format")
}

type CreateTicketTypeInput struct {
	Name        string `json:"name"        validate:"required,min=2,max=100"`
	Description string `json:"description" validate:"omitempty"`
	Price       string `json:"price"       validate:"required"`
	Quantity    int32  `json:"quantity"    validate:"required,min=1"`
	IsFree      bool   `json:"is_free"`
	SaleStarts  string `json:"sale_starts" validate:"omitempty"`
	SaleEnds    string `json:"sale_ends"   validate:"omitempty"`
}

type UpdateTicketTypeInput struct {
	Name        string `json:"name"        validate:"required,min=2,max=100"`
	Description string `json:"description" validate:"omitempty"`
	Price       string `json:"price"       validate:"required"`
	Quantity    int32  `json:"quantity"    validate:"required,min=1"`
	IsFree      bool   `json:"is_free"`
	SaleStarts  string `json:"sale_starts" validate:"omitempty"`
	SaleEnds    string `json:"sale_ends"   validate:"omitempty"`
}

func (s *TicketTypeService) CreateTicketType(ctx context.Context, eventID, organiserID string, input CreateTicketTypeInput) (repository.TicketType, error) {
	// validate struct
	if err := s.validate.Struct(input); err != nil {
		return repository.TicketType{}, formatValidationError(err, s.trans)
	}

	// parse IDs
	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return repository.TicketType{}, response.ErrNotFound
	}

	parsedOrganiserID, err := uuid.Parse(organiserID)
	if err != nil {
		return repository.TicketType{}, response.ErrNotFound
	}

	// fetch event and check ownership
	event, err := s.db.GetEventById(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true})
	if err != nil {
		return repository.TicketType{}, response.ErrNotFound
	}

	if event.OrganiserID.Bytes != parsedOrganiserID {
		return repository.TicketType{}, response.ErrNotFound
	}

	// parse price
	priceCents, err := parsePriceToCents(input.Price)
	if err != nil || priceCents < 0 {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	// enforce free/paid logic
	if input.IsFree {
		priceCents = 0
	} else if priceCents == 0 {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	// quantity
	if input.Quantity <= 0 {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	// sale window
	var saleStarts, saleEnds pgtype.Timestamp

	if input.SaleStarts != "" {
		saleStarts, err = parseTime(input.SaleStarts)
		if err != nil {
			return repository.TicketType{}, response.ErrInvalidInput
		}
	}

	if input.SaleEnds != "" {
		saleEnds, err = parseTime(input.SaleEnds)
		if err != nil {
			return repository.TicketType{}, response.ErrInvalidInput
		}
	}

	if saleStarts.Valid && saleEnds.Valid && saleEnds.Time.Before(saleStarts.Time) {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	if saleEnds.Valid && event.StartsAt.Valid && saleEnds.Time.After(event.StartsAt.Time) {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	// create
	created, err := s.db.CreateTicketType(ctx, repository.CreateTicketTypeParams{
		EventID:     pgtype.UUID{Bytes: parsedEventID, Valid: true},
		Name:        input.Name,
		Description: pgtype.Text{String: input.Description, Valid: input.Description != ""},
		Price:       priceCents,
		Currency:    "KES",
		Quantity:    input.Quantity,
		IsFree:      input.IsFree,
		SaleStarts:  saleStarts,
		SaleEnds:    saleEnds,
	})
	if err != nil {
		return repository.TicketType{}, response.ErrDatabase
	}

	return created, nil
}

func (s *TicketTypeService) GetTicketTypeByID(ctx context.Context, ticketTypeID string) (repository.TicketType, error) {
	parsedID, err := uuid.Parse(ticketTypeID)
	if err != nil {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	ticketType, err := s.db.GetTicketTypeById(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.TicketType{}, response.ErrNotFound
		}
		return repository.TicketType{}, response.ErrDatabase
	}

	return ticketType, nil
}

func (s *TicketTypeService) GetTicketTypesByEvent(ctx context.Context, eventID string) ([]repository.TicketType, error) {
	parsedID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, response.ErrInvalidInput
	}

	ticketTypes, err := s.db.GetTicketTypesByEvent(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return ticketTypes, nil
}

func (s *TicketTypeService) GetAvailableTicketTypes(ctx context.Context, eventID string) ([]repository.TicketType, error) {
	parsedID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, response.ErrInvalidInput
	}

	ticketTypes, err := s.db.GetAvailableTicketTypes(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return ticketTypes, nil
}

func (s *TicketTypeService) UpdateTicketType(ctx context.Context, ticketTypeID, organiserID string, input UpdateTicketTypeInput) (repository.TicketType, error) {

	// validate input
	if err := s.validate.Struct(input); err != nil {
		return repository.TicketType{}, formatValidationError(err, s.trans)
	}

	// parse IDs
	parsedTicketTypeID, err := uuid.Parse(ticketTypeID)
	if err != nil {
		return repository.TicketType{}, response.ErrNotFound
	}

	parsedOrganiserID, err := uuid.Parse(organiserID)
	if err != nil {
		return repository.TicketType{}, response.ErrNotFound
	}

	// fetch ticket type
	ticketType, err := s.db.GetTicketTypeById(ctx, pgtype.UUID{
		Bytes: parsedTicketTypeID,
		Valid: true,
	})
	if err != nil {
		return repository.TicketType{}, response.ErrNotFound
	}

	// fetch event and check ownership
	event, err := s.db.GetEventById(ctx, ticketType.EventID)
	if err != nil {
		return repository.TicketType{}, response.ErrNotFound
	}

	if event.OrganiserID.Bytes != parsedOrganiserID {
		return repository.TicketType{}, response.ErrNotFound
	}

	// parse price
	priceCents, err := parsePriceToCents(input.Price)
	if err != nil || priceCents < 0 {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	// free/paid logic
	if input.IsFree {
		priceCents = 0
	} else if priceCents == 0 {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	// quantity
	if input.Quantity <= 0 {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	// sale window
	saleStarts := ticketType.SaleStarts
	saleEnds := ticketType.SaleEnds

	if input.SaleStarts != "" {
		saleStarts, err = parseTime(input.SaleStarts)
		if err != nil {
			return repository.TicketType{}, response.ErrInvalidInput
		}
	}

	if input.SaleEnds != "" {
		saleEnds, err = parseTime(input.SaleEnds)
		if err != nil {
			return repository.TicketType{}, response.ErrInvalidInput
		}
	}

	if saleStarts.Valid && saleEnds.Valid && saleEnds.Time.Before(saleStarts.Time) {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	if saleEnds.Valid && event.StartsAt.Valid && saleEnds.Time.After(event.StartsAt.Time) {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	// update DB
	updatedTicketType, err := s.db.UpdateTicketType(ctx, repository.UpdateTicketTypeParams{
		ID:          pgtype.UUID{Bytes: parsedTicketTypeID, Valid: true},
		Name:        input.Name,
		Description: pgtype.Text{String: input.Description, Valid: input.Description != ""},
		Price:       priceCents,
		Currency:    "KES",
		Quantity:    input.Quantity,
		IsFree:      input.IsFree,
		SaleStarts:  saleStarts,
		SaleEnds:    saleEnds,
	})
	if err != nil {
		return repository.TicketType{}, response.ErrDatabase
	}

	return updatedTicketType, nil
}

func (s *TicketTypeService) DeleteTicketType(ctx context.Context, ticketTypeID, organiserID string) error {
	// parse ticket type ID
	parsedTicketTypeID, err := uuid.Parse(ticketTypeID)
	if err != nil {
		return response.ErrNotFound
	}

	// parse organiser ID
	parsedOrganiserID, err := uuid.Parse(organiserID)
	if err != nil {
		return response.ErrNotFound
	}

	// fetch ticket type
	ticketType, err := s.db.GetTicketTypeById(ctx, pgtype.UUID{
		Bytes: parsedTicketTypeID,
		Valid: true,
	})
	if err != nil {
		return response.ErrNotFound
	}

	// fetch event
	event, err := s.db.GetEventById(ctx, ticketType.EventID)
	if err != nil {
		return response.ErrNotFound
	}

	// ownership check
	if event.OrganiserID.Bytes != parsedOrganiserID {
		return response.ErrNotFound
	}

	// delete
	if err := s.db.DeleteTicketType(ctx, pgtype.UUID{
		Bytes: parsedTicketTypeID,
		Valid: true,
	}); err != nil {
		return response.ErrDatabase
	}

	return nil
}
