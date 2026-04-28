package mock

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/mock"
)

var _ service.UserQuerier = (*UserQueries)(nil)

type UserQueries struct {
	mock.Mock
}

func (m *UserQueries) GetUserById(ctx context.Context, id pgtype.UUID) (repository.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *UserQueries) GetUserByEmail(ctx context.Context, email string) (repository.User, error) {
	args := m.Called(ctx, email)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *UserQueries) UpdateUserProfile(ctx context.Context, arg repository.UpdateUserProfileParams) (repository.User, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *UserQueries) UpdateUserPassword(ctx context.Context, arg repository.UpdateUserPasswordParams) (repository.User, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *UserQueries) UpdateUserAvatar(ctx context.Context, arg repository.UpdateUserAvatarParams) (repository.User, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *UserQueries) DeleteUser(ctx context.Context, id pgtype.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}
