package service

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
)

type AuthQuerier interface {
	CreateUser(ctx context.Context, arg repository.CreateUserParams) (repository.User, error)
	GetUserByEmail(ctx context.Context, email string) (repository.User, error)
	GetUserById(ctx context.Context, id pgtype.UUID) (repository.User, error)
	CreateRefreshToken(ctx context.Context, arg repository.CreateRefreshTokenParams) (repository.RefreshToken, error)
	GetRefreshToken(ctx context.Context, token string) (repository.RefreshToken, error)
	RevokeRefreshToken(ctx context.Context, token string) error
	RevokeAllUserTokens(ctx context.Context, userID pgtype.UUID) error
	CreatePasswordResetToken(ctx context.Context, arg repository.CreatePasswordResetTokenParams) (repository.PasswordResetToken, error)
	GetPasswordResetToken(ctx context.Context, token string) (repository.PasswordResetToken, error)
	MarkPasswordResetTokenUsed(ctx context.Context, token string) error
	DeleteUserPasswordResetTokens(ctx context.Context, userID pgtype.UUID) error
	UpdateUserPassword(ctx context.Context, arg repository.UpdateUserPasswordParams) (repository.User, error)
}

type UserQuerier interface {
	GetUserById(ctx context.Context, id pgtype.UUID) (repository.User, error)
	GetUserByEmail(ctx context.Context, email string) (repository.User, error)
	UpdateUserProfile(ctx context.Context, arg repository.UpdateUserProfileParams) (repository.User, error)
	UpdateUserPassword(ctx context.Context, arg repository.UpdateUserPasswordParams) (repository.User, error)
	UpdateUserAvatar(ctx context.Context, arg repository.UpdateUserAvatarParams) (repository.User, error)
	DeleteUser(ctx context.Context, id pgtype.UUID) error
}

type EventQuerier interface {
	CreateEvent(ctx context.Context, arg repository.CreateEventParams) (repository.Event, error)
	GetEventById(ctx context.Context, id pgtype.UUID) (repository.Event, error)
	GetEventBySlug(ctx context.Context, slug string) (repository.Event, error)
	GetEventsByOrganiser(ctx context.Context, organiserID pgtype.UUID) ([]repository.Event, error)
	GetPublishedEvents(ctx context.Context) ([]repository.Event, error)
	GetUpcomingEvents(ctx context.Context) ([]repository.Event, error)
	UpdateEvent(ctx context.Context, arg repository.UpdateEventParams) (repository.Event, error)
	UpdateEventStatus(ctx context.Context, arg repository.UpdateEventStatusParams) (repository.Event, error)
	DeleteEvent(ctx context.Context, id pgtype.UUID) error
}

type TicketTypeQuerier interface {
	CreateTicketType(ctx context.Context, arg repository.CreateTicketTypeParams) (repository.TicketType, error)
	GetTicketTypeById(ctx context.Context, id pgtype.UUID) (repository.TicketType, error)
	GetTicketTypesByEvent(ctx context.Context, eventID pgtype.UUID) ([]repository.TicketType, error)
	GetAvailableTicketTypes(ctx context.Context, eventID pgtype.UUID) ([]repository.TicketType, error)
	GetEventById(ctx context.Context, id pgtype.UUID) (repository.Event, error)
	UpdateTicketType(ctx context.Context, arg repository.UpdateTicketTypeParams) (repository.TicketType, error)
	DeleteTicketType(ctx context.Context, id pgtype.UUID) error
}

type PaymentQuerier interface {
	GetTicketTypeById(ctx context.Context, id pgtype.UUID) (repository.TicketType, error)
	CreateOrder(ctx context.Context, arg repository.CreateOrderParams) (repository.Order, error)
	GetOrderByPaymentRef(ctx context.Context, paymentRef pgtype.Text) (repository.Order, error)
	GetOrderById(ctx context.Context, id pgtype.UUID) (repository.Order, error)
	UpdateOrderStatus(ctx context.Context, arg repository.UpdateOrderStatusParams) (repository.Order, error)
	UpdateOrderPayment(ctx context.Context, arg repository.UpdateOrderPaymentParams) (repository.Order, error)
	UpdateOrderQRCode(ctx context.Context, arg repository.UpdateOrderQRCodeParams) (repository.Order, error)
	IncrementQuantitySold(ctx context.Context, arg repository.IncrementQuantitySoldParams) (repository.TicketType, error)
	GetUserById(ctx context.Context, id pgtype.UUID) (repository.User, error)
	GetEventById(ctx context.Context, id pgtype.UUID) (repository.Event, error)
}

type PaymentDB interface {
	Queries() *repository.Queries
	WithTransaction(ctx context.Context, fn func(q *repository.Queries) error) error
}

type CheckInQuerier interface {
	GetOrderByQRCode(ctx context.Context, qrCode pgtype.Text) (repository.Order, error)
	GetEventById(ctx context.Context, id pgtype.UUID) (repository.Event, error)
	CheckInOrder(ctx context.Context, id pgtype.UUID) (repository.Order, error)
	GetCheckedInOrders(ctx context.Context, eventID pgtype.UUID) ([]repository.Order, error)
}
