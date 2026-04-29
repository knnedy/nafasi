package service_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/repository/mock"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/assert"
	mocktestify "github.com/stretchr/testify/mock"
)

func newTestCheckInService(q *mock.CheckInQueries) *service.CheckInService {
	return service.NewCheckInService(q)
}

// Test Invalid QRcode
func TestCheckIn_InvalidQRCode(t *testing.T) {
	q := new(mock.CheckInQueries)
	svc := newTestCheckInService(q)

	_, err := svc.CheckIn(context.Background(), uuid.New().String(), "")

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

// Test Order Not Found
func TestCheckIn_OrderNotFound(t *testing.T) {
	q := new(mock.CheckInQueries)
	svc := newTestCheckInService(q)

	q.On("GetOrderByQRCode", mocktestify.Anything, mocktestify.Anything).
		Return(repository.Order{}, errors.New("not found"))

	_, err := svc.CheckIn(context.Background(), uuid.New().String(), "qr123")

	assert.ErrorIs(t, err, response.ErrNotFound)
	q.AssertExpectations(t)
}

// Test Not Paid
func TestCheckIn_OrderNotPaid(t *testing.T) {
	q := new(mock.CheckInQueries)
	svc := newTestCheckInService(q)

	order := repository.Order{
		ID:     pgtype.UUID{Bytes: uuid.New(), Valid: true},
		Status: repository.OrderStatusPENDING,
	}

	q.On("GetOrderByQRCode", mocktestify.Anything, mocktestify.Anything).
		Return(order, nil)

	_, err := svc.CheckIn(context.Background(), uuid.New().String(), "qr123")

	assert.ErrorIs(t, err, response.ErrOrderNotPaid)
	q.AssertExpectations(t)
}

// Test Already Checked In
func TestCheckIn_AlreadyCheckedIn(t *testing.T) {
	q := new(mock.CheckInQueries)
	svc := newTestCheckInService(q)

	order := repository.Order{
		ID:        pgtype.UUID{Bytes: uuid.New(), Valid: true},
		Status:    repository.OrderStatusPAID,
		CheckedIn: true,
	}

	q.On("GetOrderByQRCode", mocktestify.Anything, mocktestify.Anything).
		Return(order, nil)

	_, err := svc.CheckIn(context.Background(), uuid.New().String(), "qr123")

	assert.ErrorIs(t, err, response.ErrTicketAlreadyCheckedIn)
	q.AssertExpectations(t)
}

// Test Not Event Owner
func TestCheckIn_NotEventOwner(t *testing.T) {
	q := new(mock.CheckInQueries)
	svc := newTestCheckInService(q)

	order := repository.Order{
		ID:        pgtype.UUID{Bytes: uuid.New(), Valid: true},
		EventID:   pgtype.UUID{Bytes: uuid.New(), Valid: true},
		Status:    repository.OrderStatusPAID,
		CheckedIn: false,
	}

	q.On("GetOrderByQRCode", mocktestify.Anything, mocktestify.Anything).
		Return(order, nil)

	q.On("GetEventById", mocktestify.Anything, order.EventID).
		Return(repository.Event{
			OrganiserID: pgtype.UUID{Bytes: uuid.New(), Valid: true}, // different
		}, nil)

	_, err := svc.CheckIn(context.Background(), uuid.New().String(), "qr123")

	assert.ErrorIs(t, err, response.ErrNotFound)
	q.AssertExpectations(t)
}

// Test Success
func TestCheckIn_Success(t *testing.T) {
	q := new(mock.CheckInQueries)
	svc := newTestCheckInService(q)

	organiserID := uuid.New()
	userID := uuid.New()
	eventID := uuid.New()
	orderID := uuid.New()

	order := repository.Order{
		ID:        pgtype.UUID{Bytes: orderID, Valid: true},
		EventID:   pgtype.UUID{Bytes: eventID, Valid: true},
		UserID:    pgtype.UUID{Bytes: userID, Valid: true},
		Status:    repository.OrderStatusPAID,
		CheckedIn: false,
	}

	q.On("GetOrderByQRCode", mocktestify.Anything, mocktestify.Anything).
		Return(order, nil)

	q.On("GetEventById", mocktestify.Anything, order.EventID).
		Return(repository.Event{
			OrganiserID: pgtype.UUID{Bytes: organiserID, Valid: true},
		}, nil)

	q.On("CheckInOrder", mocktestify.Anything, order.ID).
		Return(repository.Order{
			ID:        order.ID,
			EventID:   order.EventID,
			UserID:    order.UserID,
			CheckedIn: true,
		}, nil)

	res, err := svc.CheckIn(context.Background(), organiserID.String(), "qr123")

	assert.NoError(t, err)
	assert.True(t, res.CheckedIn)
	q.AssertExpectations(t)
}
