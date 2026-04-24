package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
)

type CheckInService struct {
	queries *repository.Queries
}

func NewCheckInService(queries *repository.Queries) *CheckInService {
	return &CheckInService{queries: queries}
}

type CheckInResult struct {
	OrderID   string `json:"order_id"`
	EventID   string `json:"event_id"`
	UserID    string `json:"user_id"`
	CheckedIn bool   `json:"checked_in"`
	Message   string `json:"message"`
}

func (s *CheckInService) CheckIn(ctx context.Context, organiserID, qrCode string) (*CheckInResult, error) {
	if qrCode == "" {
		return nil, response.ErrInvalidInput
	}

	// parse organiser ID
	parsedOrganiserID, err := uuid.Parse(organiserID)
	if err != nil {
		return nil, response.ErrNotFound
	}

	// find order by qr code
	order, err := s.queries.GetOrderByQRCode(ctx, pgtype.Text{String: qrCode, Valid: true})
	if err != nil {
		return nil, response.ErrNotFound
	}

	// verify order is paid
	if order.Status != repository.OrderStatusPAID {
		return nil, response.ErrOrderNotPaid
	}

	// verify ticket is not already checked in
	if order.CheckedIn {
		return nil, response.ErrTicketAlreadyCheckedIn
	}

	// verify organiser owns the event
	event, err := s.queries.GetEventById(ctx, order.EventID)
	if err != nil {
		return nil, response.ErrNotFound
	}
	if event.OrganiserID.Bytes != parsedOrganiserID {
		return nil, response.ErrNotFound
	}

	// check in the order
	updatedOrder, err := s.queries.CheckInOrder(ctx, order.ID)
	if err != nil {
		return nil, response.ErrDatabase
	}

	return &CheckInResult{
		OrderID:   uuid.UUID(updatedOrder.ID.Bytes).String(),
		EventID:   uuid.UUID(updatedOrder.EventID.Bytes).String(),
		UserID:    uuid.UUID(updatedOrder.UserID.Bytes).String(),
		CheckedIn: updatedOrder.CheckedIn,
		Message:   "checked in successfully",
	}, nil
}

func (s *CheckInService) GetCheckedInOrders(ctx context.Context, organiserID string, eventID string) ([]repository.Order, error) {
	parsedOrganiserID, err := uuid.Parse(organiserID)
	if err != nil {
		return nil, response.ErrNotFound
	}

	parsedEventID, err := uuid.Parse(eventID)
	if err != nil {
		return nil, response.ErrNotFound
	}

	// verify organiser owns the event
	event, err := s.queries.GetEventById(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true})
	if err != nil {
		return nil, response.ErrNotFound
	}

	if event.OrganiserID.Bytes != parsedOrganiserID {
		return nil, response.ErrForbidden
	}

	orders, err := s.queries.GetCheckedInOrders(ctx, pgtype.UUID{Bytes: parsedEventID, Valid: true})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return orders, nil
}
