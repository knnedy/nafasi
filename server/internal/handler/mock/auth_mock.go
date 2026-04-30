package mock

import (
	"context"

	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/mock"
)

// AuthService mock
type AuthService struct {
	mock.Mock
}

func (m *AuthService) Register(ctx context.Context, input service.RegisterInput) (service.AuthResult, error) {
	args := m.Called(ctx, input)
	return args.Get(0).(service.AuthResult), args.Error(1)
}

func (m *AuthService) Login(ctx context.Context, input service.LoginInput) (service.AuthResult, error) {
	args := m.Called(ctx, input)
	return args.Get(0).(service.AuthResult), args.Error(1)
}

func (m *AuthService) RefreshAccessToken(ctx context.Context, refreshToken string) (service.AuthResult, error) {
	args := m.Called(ctx, refreshToken)
	return args.Get(0).(service.AuthResult), args.Error(1)
}

func (m *AuthService) ForgotPassword(ctx context.Context, input service.ForgotPasswordInput) error {
	args := m.Called(ctx, input)
	return args.Error(0)
}

func (m *AuthService) ResetPassword(ctx context.Context, input service.ResetPasswordInput) error {
	args := m.Called(ctx, input)
	return args.Error(0)
}

func (m *AuthService) Logout(ctx context.Context, refreshToken string) error {
	args := m.Called(ctx, refreshToken)
	return args.Error(0)
}
