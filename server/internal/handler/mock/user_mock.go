package mock

import (
	"context"

	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/mock"
)

type UserService struct {
	mock.Mock
}

func (m *UserService) GetMe(ctx context.Context, userID string) (repository.User, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *UserService) UpdateProfile(ctx context.Context, userID string, input service.UpdateProfileInput) (repository.User, error) {
	args := m.Called(ctx, userID, input)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *UserService) UpdatePassword(ctx context.Context, userID string, input service.UpdatePasswordInput) error {
	args := m.Called(ctx, userID, input)
	return args.Error(0)
}

func (m *UserService) UpdateAvatar(ctx context.Context, userID string, input service.UpdateAvatarInput) (repository.User, error) {
	args := m.Called(ctx, userID, input)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *UserService) DeleteMe(ctx context.Context, userID string) (repository.User, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).(repository.User), args.Error(1)
}
