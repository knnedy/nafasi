package mock

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/mock"
)

// compile time check — fails immediately if mock doesn't satisfy interface
var _ service.AuthQuerier = (*Queries)(nil)

type Queries struct {
	mock.Mock
}

func (m *Queries) CreateUser(ctx context.Context, arg repository.CreateUserParams) (repository.User, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *Queries) GetUserByEmail(ctx context.Context, email string) (repository.User, error) {
	args := m.Called(ctx, email)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *Queries) GetUserById(ctx context.Context, id pgtype.UUID) (repository.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *Queries) CreateRefreshToken(ctx context.Context, arg repository.CreateRefreshTokenParams) (repository.RefreshToken, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.RefreshToken), args.Error(1)
}

func (m *Queries) GetRefreshToken(ctx context.Context, token string) (repository.RefreshToken, error) {
	args := m.Called(ctx, token)
	return args.Get(0).(repository.RefreshToken), args.Error(1)
}

func (m *Queries) RevokeRefreshToken(ctx context.Context, token string) error {
	args := m.Called(ctx, token)
	return args.Error(0)
}

func (m *Queries) RevokeAllUserTokens(ctx context.Context, userID pgtype.UUID) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func (m *Queries) CreatePasswordResetToken(ctx context.Context, arg repository.CreatePasswordResetTokenParams) (repository.PasswordResetToken, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.PasswordResetToken), args.Error(1)
}

func (m *Queries) GetPasswordResetToken(ctx context.Context, token string) (repository.PasswordResetToken, error) {
	args := m.Called(ctx, token)
	return args.Get(0).(repository.PasswordResetToken), args.Error(1)
}

func (m *Queries) MarkPasswordResetTokenUsed(ctx context.Context, token string) error {
	args := m.Called(ctx, token)
	return args.Error(0)
}

func (m *Queries) DeleteUserPasswordResetTokens(ctx context.Context, userID pgtype.UUID) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func (m *Queries) UpdateUserPassword(ctx context.Context, arg repository.UpdateUserPasswordParams) (repository.User, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.User), args.Error(1)
}
