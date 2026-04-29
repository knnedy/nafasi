package handler

import (
	"context"

	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/service"
)

type AuthServicer interface {
	Register(ctx context.Context, input service.RegisterInput) (service.AuthResult, error)
	Login(ctx context.Context, input service.LoginInput) (service.AuthResult, error)
	RefreshAccessToken(ctx context.Context, refreshToken string) (service.AuthResult, error)
	ForgotPassword(ctx context.Context, input service.ForgotPasswordInput) error
	ResetPassword(ctx context.Context, input service.ResetPasswordInput) error
	Logout(ctx context.Context, refreshToken string) error
}

type UserServicer interface {
	GetMe(ctx context.Context, userID string) (repository.User, error)
	UpdateProfile(ctx context.Context, userID string, input service.UpdateProfileInput) (repository.User, error)
	UpdatePassword(ctx context.Context, userID string, input service.UpdatePasswordInput) error
	UpdateAvatar(ctx context.Context, userID string, input service.UpdateAvatarInput) (repository.User, error)
	DeleteMe(ctx context.Context, userID string) error
}

type EventServicer interface {
	CreateEvent(ctx context.Context, organiserID string, input service.CreateEventInput) (repository.Event, error)
	GetEventByID(ctx context.Context, eventID string) (repository.Event, error)
	GetEventBySlug(ctx context.Context, slug string) (repository.Event, error)
	GetEventsByOrganiser(ctx context.Context, organiserID string) ([]repository.Event, error)
	GetPublishedEvents(ctx context.Context) ([]repository.Event, error)
	GetUpcomingEvents(ctx context.Context) ([]repository.Event, error)
	UpdateEvent(ctx context.Context, eventID string, organiserID string, input service.UpdateEventInput) (repository.Event, error)
	UpdateEventStatus(ctx context.Context, eventID string, organiserID string, input service.UpdateEventStatusInput) (repository.Event, error)
	DeleteEvent(ctx context.Context, eventID string, organiserID string) error
}

type TicketTypeServicer interface {
	CreateTicketType(ctx context.Context, eventID, organiserID string, input service.CreateTicketTypeInput) (repository.TicketType, error)
	GetTicketTypeByID(ctx context.Context, ticketTypeID string) (repository.TicketType, error)
	GetTicketTypesByEvent(ctx context.Context, eventID string) ([]repository.TicketType, error)
	GetAvailableTicketTypes(ctx context.Context, eventID string) ([]repository.TicketType, error)
	UpdateTicketType(ctx context.Context, ticketTypeID, organiserID string, input service.UpdateTicketTypeInput) (repository.TicketType, error)
	DeleteTicketType(ctx context.Context, ticketTypeID, organiserID string) error
}

type PaymentServicer interface {
	InitiatePayment(ctx context.Context, userID string, input service.InitiatePaymentInput) (*service.PaymentResult, error)
	HandleMpesaCallback(ctx context.Context, callback service.MpesaCallback) error
	QueryPaymentStatus(ctx context.Context, orderID string) (*repository.Order, error)
}

type CheckInServicer interface {
	CheckIn(ctx context.Context, organiserID string, qrCode string) (*service.CheckInResult, error)
	GetCheckedInOrders(ctx context.Context, organiserID string, eventID string) ([]repository.Order, error)
}
