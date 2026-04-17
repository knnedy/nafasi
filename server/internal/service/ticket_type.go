package service

import (
	"context"

	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
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

type CreateTicketTypeInput struct {
	Name        string  `json:"name"        validate:"required,min=2,max=100"`
	Description string  `json:"description" validate:"omitempty"`
	Price       float64 `json:"price"       validate:"min=0"`
	Currency    string  `json:"currency"    validate:"required"`
	Quantity    int32   `json:"quantity"    validate:"required,min=1"`
	IsFree      bool    `json:"is_free"`
	SaleStarts  string  `json:"sale_starts" validate:"omitempty"`
	SaleEnds    string  `json:"sale_ends"   validate:"omitempty"`
}

type UpdateTicketTypeInput struct {
	Name        string  `json:"name"        validate:"required,min=2,max=100"`
	Description string  `json:"description" validate:"omitempty"`
	Price       float64 `json:"price"       validate:"min=0"`
	Currency    string  `json:"currency"    validate:"required"`
	Quantity    int32   `json:"quantity"    validate:"required,min=1"`
	IsFree      bool    `json:"is_free"`
	SaleStarts  string  `json:"sale_starts" validate:"omitempty"`
	SaleEnds    string  `json:"sale_ends"   validate:"omitempty"`
}

func (s *TicketTypeService) CreateTicketType(ctx context.Context, eventID string, organiserID string, input CreateTicketTypeInput) (repository.TicketType, error) {
	if err := s.validate.Struct(input); err != nil {
		return repository.TicketType{}, formatValidationError(err, s.trans)
	}

	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return repository.TicketType{}, response.ErrNotFound
	}

	// free tickets must have price 0
	if input.IsFree && input.Price != 0 {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	// paid tickets must have price > 0
	if !input.IsFree && input.Price == 0 {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	// parse sale window if provided
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

	// sale_ends must be after sale_starts if both provided
	if saleStarts.Valid && saleEnds.Valid && saleEnds.Time.Before(saleStarts.Time) {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	// convert price to pgtype.Numeric
	price := pgtype.Numeric{}
	if err := price.Scan(input.Price); err != nil {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	ticketType, err := s.db.CreateTicketType(ctx, repository.CreateTicketTypeParams{
		EventID:     pgtype.UUID{Bytes: parsedEventID, Valid: true},
		Name:        input.Name,
		Description: pgtype.Text{String: input.Description, Valid: input.Description != ""},
		Price:       price,
		Currency:    input.Currency,
		Quantity:    input.Quantity,
		IsFree:      input.IsFree,
		SaleStarts:  saleStarts,
		SaleEnds:    saleEnds,
	})
	if err != nil {
		return repository.TicketType{}, response.ErrDatabase
	}

	return ticketType, nil
}

func (s *TicketTypeService) GetTicketTypeByID(ctx context.Context, ticketTypeID string) (repository.TicketType, error) {
	parsedID, err := uuid.Parse(ticketTypeID)
	if err != nil {
		return repository.TicketType{}, response.ErrNotFound
	}

	ticketType, err := s.db.GetTicketTypeById(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		return repository.TicketType{}, response.ErrNotFound
	}

	return ticketType, nil
}

func (s *TicketTypeService) GetTicketTypesByEvent(ctx context.Context, eventID string) ([]repository.TicketType, error) {
	parsedID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, response.ErrNotFound
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
		return nil, response.ErrNotFound
	}

	ticketTypes, err := s.db.GetAvailableTicketTypes(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return ticketTypes, nil
}

func (s *TicketTypeService) UpdateTicketType(ctx context.Context, ticketTypeID string, organiserID string, input UpdateTicketTypeInput) (repository.TicketType, error) {
	if err := s.validate.Struct(input); err != nil {
		return repository.TicketType{}, formatValidationError(err, s.trans)
	}

	parsedID, err := uuid.Parse(ticketTypeID)
	if err != nil {
		return repository.TicketType{}, response.ErrNotFound
	}

	// verify ticket type exists
	_, err = s.db.GetTicketTypeById(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		return repository.TicketType{}, response.ErrNotFound
	}

	// free tickets must have price 0
	if input.IsFree && input.Price != 0 {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	// paid tickets must have price > 0
	if !input.IsFree && input.Price == 0 {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	// parse sale window if provided
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

	price := pgtype.Numeric{}
	if err := price.Scan(input.Price); err != nil {
		return repository.TicketType{}, response.ErrInvalidInput
	}

	ticketType, err := s.db.UpdateTicketType(ctx, repository.UpdateTicketTypeParams{
		ID:          pgtype.UUID{Bytes: parsedID, Valid: true},
		Name:        input.Name,
		Description: pgtype.Text{String: input.Description, Valid: input.Description != ""},
		Price:       price,
		Currency:    input.Currency,
		Quantity:    input.Quantity,
		IsFree:      input.IsFree,
		SaleStarts:  saleStarts,
		SaleEnds:    saleEnds,
	})
	if err != nil {
		return repository.TicketType{}, response.ErrDatabase
	}

	return ticketType, nil
}

func (s *TicketTypeService) DeleteTicketType(ctx context.Context, ticketTypeID string, organiserID string) error {
	parsedID, err := uuid.Parse(ticketTypeID)
	if err != nil {
		return response.ErrNotFound
	}

	// verify ticket type exists
	_, err = s.db.GetTicketTypeById(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		return response.ErrNotFound
	}

	if err := s.db.DeleteTicketType(ctx, pgtype.UUID{Bytes: parsedID, Valid: true}); err != nil {
		return response.ErrDatabase
	}

	return nil
}
