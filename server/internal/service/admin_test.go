package service_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/knnedy/nafasi/internal/service/mock"
	"github.com/stretchr/testify/assert"
	mocktestify "github.com/stretchr/testify/mock"
)

func newTestAdminService(db *mock.AdminQueries) *service.AdminService {
	return service.NewAdminService(db)
}

func makeAdminUserID() pgtype.UUID {
	return pgtype.UUID{Bytes: uuid.New(), Valid: true}
}

// AdminGetAllUsers
func TestAdminGetAllUsers_Success(t *testing.T) {
	db := new(mock.AdminQueries)
	svc := newTestAdminService(db)

	db.On("AdminGetAllUsers", mocktestify.Anything, repository.AdminGetAllUsersParams{
		Limit:  10,
		Offset: 0,
	}).Return([]repository.User{
		{ID: makeAdminUserID()},
	}, nil)

	users, err := svc.AdminGetAllUsers(context.Background(), 10, 0)

	assert.NoError(t, err)
	assert.Len(t, users, 1)
	db.AssertExpectations(t)
}

// AdminGetUserById
func TestAdminGetUserById_Success(t *testing.T) {
	db := new(mock.AdminQueries)
	svc := newTestAdminService(db)

	id := uuid.New().String()
	parsedID, _ := uuid.Parse(id)

	db.On("AdminGetUserById", mocktestify.Anything, pgtype.UUID{Bytes: parsedID, Valid: true}).
		Return(repository.User{ID: pgtype.UUID{Bytes: parsedID, Valid: true}}, nil)

	user, err := svc.AdminGetUserById(context.Background(), id)

	assert.NoError(t, err)
	assert.Equal(t, parsedID, uuid.UUID(user.ID.Bytes))
	db.AssertExpectations(t)
}

func TestAdminGetUserById_InvalidID(t *testing.T) {
	db := new(mock.AdminQueries)
	svc := newTestAdminService(db)

	_, err := svc.AdminGetUserById(context.Background(), "bad")

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

// AdminBanUser
func TestAdminBanUser_Success(t *testing.T) {
	db := new(mock.AdminQueries)
	svc := newTestAdminService(db)

	id := uuid.New().String()
	parsedID, _ := uuid.Parse(id)

	db.On("AdminBanUser", mocktestify.Anything, pgtype.UUID{Bytes: parsedID, Valid: true}).
		Return(repository.User{ID: pgtype.UUID{Bytes: parsedID, Valid: true}}, nil)

	user, err := svc.AdminBanUser(context.Background(), id)

	assert.NoError(t, err)
	assert.Equal(t, parsedID, uuid.UUID(user.ID.Bytes))
	db.AssertExpectations(t)
}

// AdminUnbanUser
func TestAdminUnbanUser_Success(t *testing.T) {
	db := new(mock.AdminQueries)
	svc := newTestAdminService(db)

	id := uuid.New().String()
	parsedID, _ := uuid.Parse(id)

	db.On("AdminUnbanUser", mocktestify.Anything, pgtype.UUID{Bytes: parsedID, Valid: true}).
		Return(repository.User{ID: pgtype.UUID{Bytes: parsedID, Valid: true}}, nil)

	user, err := svc.AdminUnbanUser(context.Background(), id)

	assert.NoError(t, err)
	assert.Equal(t, parsedID, uuid.UUID(user.ID.Bytes))
	db.AssertExpectations(t)
}

// AdminDeleteUser
func TestAdminDeleteUser_Success(t *testing.T) {
	db := new(mock.AdminQueries)
	svc := newTestAdminService(db)

	id := uuid.New().String()
	parsedID, _ := uuid.Parse(id)

	db.On("AdminDeleteUser", mocktestify.Anything, pgtype.UUID{Bytes: parsedID, Valid: true}).
		Return(repository.User{ID: pgtype.UUID{Bytes: parsedID, Valid: true}}, nil)

	user, err := svc.AdminDeleteUser(context.Background(), id)

	assert.NoError(t, err)
	assert.Equal(t, parsedID, uuid.UUID(user.ID.Bytes))
	db.AssertExpectations(t)
}

func TestAdminDeleteUser_InvalidID(t *testing.T) {
	db := new(mock.AdminQueries)
	svc := newTestAdminService(db)

	_, err := svc.AdminDeleteUser(context.Background(), "bad")

	assert.ErrorIs(t, err, response.ErrInvalidInput)
}

// AdminGetAllEvents
func TestAdminGetAllEvents_Success(t *testing.T) {
	db := new(mock.AdminQueries)
	svc := newTestAdminService(db)

	db.On("AdminGetAllEvents", mocktestify.Anything, repository.AdminGetAllEventsParams{
		Limit:  10,
		Offset: 0,
	}).Return([]repository.AdminGetAllEventsRow{{}}, nil)

	events, err := svc.AdminGetAllEvents(context.Background(), 10, 0)

	assert.NoError(t, err)
	assert.Len(t, events, 1)
	db.AssertExpectations(t)
}

// AdminDeleteEvent
func TestAdminDeleteEvent_Success(t *testing.T) {
	db := new(mock.AdminQueries)
	svc := newTestAdminService(db)

	id := uuid.New().String()
	parsedID, _ := uuid.Parse(id)

	db.On("AdminDeleteEvent", mocktestify.Anything, pgtype.UUID{Bytes: parsedID, Valid: true}).
		Return(repository.Event{ID: pgtype.UUID{Bytes: parsedID, Valid: true}}, nil)

	event, err := svc.AdminDeleteEvent(context.Background(), id)

	assert.NoError(t, err)
	assert.Equal(t, parsedID, uuid.UUID(event.ID.Bytes))
	db.AssertExpectations(t)
}

// AdminGetTotalRevenue
func TestAdminGetTotalRevenue_Success(t *testing.T) {
	db := new(mock.AdminQueries)
	svc := newTestAdminService(db)

	db.On("AdminGetTotalRevenue", mocktestify.Anything).
		Return(int64(10000), nil)

	total, err := svc.AdminGetTotalRevenue(context.Background())

	assert.NoError(t, err)
	assert.Equal(t, int64(10000), total)
	db.AssertExpectations(t)
}

// AdminGetPlatformStats
func TestAdminGetPlatformStats_Success(t *testing.T) {
	db := new(mock.AdminQueries)
	svc := newTestAdminService(db)

	db.On("AdminGetPlatformStats", mocktestify.Anything).
		Return(repository.AdminGetPlatformStatsRow{}, nil)

	stats, err := svc.AdminGetPlatformStats(context.Background())

	assert.NoError(t, err)
	assert.NotNil(t, stats)
	db.AssertExpectations(t)
}
