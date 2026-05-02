package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
)

type OrganiserService struct {
	db OrganiserQuerier
}

func NewOrganiserService(db OrganiserQuerier) *OrganiserService {
	return &OrganiserService{db: db}
}

func (s *OrganiserService) GetTicketTypesByEvent(ctx context.Context, organiserID, eventID string) ([]repository.TicketType, error) {
	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, response.ErrInvalidInput
	}

	ticketTypes, err := s.db.GetTicketTypesByEvent(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return ticketTypes, nil
}

func (s *OrganiserService) GetTicketTypeSalesByEvent(ctx context.Context, organiserID, eventID string) ([]repository.GetTicketTypeSalesByEventRow, error) {
	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, response.ErrInvalidInput
	}

	sales, err := s.db.GetTicketTypeSalesByEvent(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return sales, nil
}

func (s *OrganiserService) GetTotalTicketsSold(ctx context.Context, organiserID, eventID string) (int64, error) {
	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return 0, response.ErrInvalidInput
	}

	total, err := s.db.GetTotalTicketsSold(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, response.ErrDatabase
	}

	return total, nil
}

func (s *OrganiserService) GetOrdersByEvent(ctx context.Context, organiserID, eventID string, limit, offset int32) ([]repository.Order, error) {
	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, response.ErrInvalidInput
	}

	orders, err := s.db.GetOrdersByEvent(ctx, repository.GetOrdersByEventParams{
		EventID: pgtype.UUID{Bytes: parsedEventID, Valid: true},
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return orders, nil
}

func (s *OrganiserService) GetOrdersByEventAndStatus(ctx context.Context, organiserID, eventID string, status repository.OrderStatus, limit, offset int32) ([]repository.Order, error) {
	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, response.ErrInvalidInput
	}

	orders, err := s.db.GetOrdersByEventAndStatus(ctx, repository.GetOrdersByEventAndStatusParams{
		EventID: pgtype.UUID{Bytes: parsedEventID, Valid: true},
		Status:  status,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return orders, nil
}

func (s *OrganiserService) GetRecentEventOrders(ctx context.Context, organiserID, eventID string, limit int32) ([]repository.Order, error) {
	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, response.ErrInvalidInput
	}

	orders, err := s.db.GetRecentEventOrders(ctx, repository.GetRecentEventOrdersParams{
		EventID: pgtype.UUID{Bytes: parsedEventID, Valid: true},
		Limit:   limit,
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return orders, nil
}

func (s *OrganiserService) GetEventRevenue(ctx context.Context, organiserID, eventID string) (int64, error) {
	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return 0, response.ErrInvalidInput
	}

	revenue, err := s.db.GetEventRevenue(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, response.ErrDatabase
	}

	return revenue, nil
}

func (s *OrganiserService) GetEventOrdersCount(ctx context.Context, organiserID, eventID string) (int64, error) {
	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return 0, response.ErrInvalidInput
	}

	count, err := s.db.GetEventOrdersCount(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, response.ErrDatabase
	}

	return count, nil
}

func (s *OrganiserService) GetEventCheckedInCount(ctx context.Context, organiserID, eventID string) (int64, error) {
	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return 0, response.ErrInvalidInput
	}

	count, err := s.db.GetEventCheckedInCount(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, response.ErrDatabase
	}

	return count, nil
}

func (s *OrganiserService) GetEventOrderStatusBreakdown(ctx context.Context, organiserID, eventID string) ([]repository.GetEventOrderStatusBreakdownRow, error) {
	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, response.ErrInvalidInput
	}

	breakdown, err := s.db.GetEventOrderStatusBreakdown(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return breakdown, nil
}

func (s *OrganiserService) GetEventTicketsSold(ctx context.Context, organiserID, eventID string) (int64, error) {
	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return 0, response.ErrInvalidInput
	}

	sold, err := s.db.GetEventTicketsSold(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, response.ErrDatabase
	}

	return sold, nil
}
