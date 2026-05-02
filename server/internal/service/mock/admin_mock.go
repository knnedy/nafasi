package mock

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/mock"
)

type AdminQueries struct {
	mock.Mock
}

var _ service.AdminQuerier = (*AdminQueries)(nil)

func (m *AdminQueries) GetUserById(ctx context.Context, id pgtype.UUID) (repository.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *AdminQueries) AdminGetAllUsers(ctx context.Context, arg repository.AdminGetAllUsersParams) ([]repository.User, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).([]repository.User), args.Error(1)
}

func (m *AdminQueries) AdminGetUsersByRole(ctx context.Context, arg repository.AdminGetUsersByRoleParams) ([]repository.User, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).([]repository.User), args.Error(1)
}

func (m *AdminQueries) AdminGetUsersByStatus(ctx context.Context, arg repository.AdminGetUsersByStatusParams) ([]repository.User, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).([]repository.User), args.Error(1)
}

func (m *AdminQueries) AdminGetUserById(ctx context.Context, id pgtype.UUID) (repository.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *AdminQueries) AdminGetPendingOrganisers(ctx context.Context) ([]repository.User, error) {
	args := m.Called(ctx)
	return args.Get(0).([]repository.User), args.Error(1)
}

func (m *AdminQueries) AdminGetApprovedOrganisers(ctx context.Context) ([]repository.User, error) {
	args := m.Called(ctx)
	return args.Get(0).([]repository.User), args.Error(1)
}

func (m *AdminQueries) AdminUpdateUserVerification(ctx context.Context, arg repository.AdminUpdateUserVerificationParams) (repository.User, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *AdminQueries) AdminBanUser(ctx context.Context, id pgtype.UUID) (repository.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *AdminQueries) AdminUnbanUser(ctx context.Context, id pgtype.UUID) (repository.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *AdminQueries) AdminSetUserRoleToAdmin(ctx context.Context, id pgtype.UUID) (repository.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *AdminQueries) AdminDeleteUser(ctx context.Context, id pgtype.UUID) (repository.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *AdminQueries) AdminGetAllEvents(ctx context.Context, arg repository.AdminGetAllEventsParams) ([]repository.AdminGetAllEventsRow, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).([]repository.AdminGetAllEventsRow), args.Error(1)
}

func (m *AdminQueries) AdminGetEventsByStatus(ctx context.Context, arg repository.AdminGetEventsByStatusParams) ([]repository.AdminGetEventsByStatusRow, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).([]repository.AdminGetEventsByStatusRow), args.Error(1)
}

func (m *AdminQueries) AdminCancelEvent(ctx context.Context, id pgtype.UUID) (repository.Event, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *AdminQueries) AdminDeleteEvent(ctx context.Context, id pgtype.UUID) (repository.Event, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.Event), args.Error(1)
}

func (m *AdminQueries) AdminGetOrdersByStatus(ctx context.Context, arg repository.AdminGetOrdersByStatusParams) ([]repository.Order, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).([]repository.Order), args.Error(1)
}

func (m *AdminQueries) AdminGetLatestOrders(ctx context.Context, limit int32) ([]repository.Order, error) {
	args := m.Called(ctx, limit)
	return args.Get(0).([]repository.Order), args.Error(1)
}

func (m *AdminQueries) AdminGetRecentOrdersWithDetails(ctx context.Context, limit int32) ([]repository.AdminGetRecentOrdersWithDetailsRow, error) {
	args := m.Called(ctx, limit)
	return args.Get(0).([]repository.AdminGetRecentOrdersWithDetailsRow), args.Error(1)
}

func (m *AdminQueries) AdminGetTotalRevenue(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *AdminQueries) AdminGetPlatformStats(ctx context.Context) (repository.AdminGetPlatformStatsRow, error) {
	args := m.Called(ctx)
	return args.Get(0).(repository.AdminGetPlatformStatsRow), args.Error(1)
}
