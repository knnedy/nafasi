package mock

import (
	"context"

	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/mock"
)

type PaymentService struct {
	mock.Mock
}

func (m *PaymentService) InitiatePayment(ctx context.Context, userID string, input service.InitiatePaymentInput) (*service.PaymentResult, error) {
	args := m.Called(ctx, userID, input)
	return args.Get(0).(*service.PaymentResult), args.Error(1)
}

func (m *PaymentService) HandleMpesaCallback(ctx context.Context, callback service.MpesaCallback) error {
	args := m.Called(ctx, callback)
	return args.Error(0)
}

func (m *PaymentService) QueryPaymentStatus(ctx context.Context, orderID string) (*repository.Order, error) {
	args := m.Called(ctx, orderID)
	return args.Get(0).(*repository.Order), args.Error(1)
}
