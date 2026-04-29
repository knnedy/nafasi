package mock

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/mock"
)

var _ service.PaymentQuerier = (*PaymentQueries)(nil)

type PaymentQueries struct {
	mock.Mock
}

func (m *PaymentQueries) GetTicketTypeById(ctx context.Context, id pgtype.UUID) (repository.TicketType, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.TicketType), args.Error(1)
}

func (m *PaymentQueries) CreateOrder(ctx context.Context, arg repository.CreateOrderParams) (repository.Order, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.Order), args.Error(1)
}

func (m *PaymentQueries) GetOrderByPaymentRef(ctx context.Context, paymentRef pgtype.Text) (repository.Order, error) {
	args := m.Called(ctx, paymentRef)
	return args.Get(0).(repository.Order), args.Error(1)
}

func (m *PaymentQueries) GetOrderById(ctx context.Context, id pgtype.UUID) (repository.Order, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.Order), args.Error(1)
}

func (m *PaymentQueries) UpdateOrderStatus(ctx context.Context, arg repository.UpdateOrderStatusParams) (repository.Order, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.Order), args.Error(1)
}

func (m *PaymentQueries) UpdateOrderPayment(ctx context.Context, arg repository.UpdateOrderPaymentParams) (repository.Order, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.Order), args.Error(1)
}

func (m *PaymentQueries) UpdateOrderQRCode(ctx context.Context, arg repository.UpdateOrderQRCodeParams) (repository.Order, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.Order), args.Error(1)
}

func (m *PaymentQueries) IncrementQuantitySold(ctx context.Context, arg repository.IncrementQuantitySoldParams) (repository.TicketType, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(repository.TicketType), args.Error(1)
}

func (m *PaymentQueries) GetUserById(ctx context.Context, id pgtype.UUID) (repository.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.User), args.Error(1)
}

func (m *PaymentQueries) GetEventById(ctx context.Context, id pgtype.UUID) (repository.Event, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(repository.Event), args.Error(1)
}

// PaymentDB mock
type PaymentDB struct {
	mock.Mock
	Q *PaymentQueries
}

func NewPaymentDB() *PaymentDB {
	return &PaymentDB{
		Q: new(PaymentQueries),
	}
}

func (m *PaymentDB) Queries() *repository.Queries {
	return nil
}

func (m *PaymentDB) WithTransaction(ctx context.Context, fn func(q *repository.Queries) error) error {
	args := m.Called(ctx, fn)
	return args.Error(0)
}
