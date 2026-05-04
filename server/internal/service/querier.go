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
	DeleteUser(ctx context.Context, id pgtype.UUID) (repository.User, error)
}

type EventQuerier interface {
	CreateEvent(ctx context.Context, arg repository.CreateEventParams) (repository.Event, error)
	GetEventById(ctx context.Context, id pgtype.UUID) (repository.Event, error)
	GetEventBySlug(ctx context.Context, slug string) (repository.Event, error)
	PublicGetPublishedEvents(ctx context.Context, arg repository.PublicGetPublishedEventsParams) ([]repository.Event, error)
	PublicGetUpcomingEvents(ctx context.Context, arg repository.PublicGetUpcomingEventsParams) ([]repository.Event, error)
	UpdateEvent(ctx context.Context, arg repository.UpdateEventParams) (repository.Event, error)
	UpdateEventStatus(ctx context.Context, arg repository.UpdateEventStatusParams) (repository.Event, error)
	DeleteEvent(ctx context.Context, id pgtype.UUID) (repository.Event, error)
}

type TicketTypeQuerier interface {
	CreateTicketType(ctx context.Context, arg repository.CreateTicketTypeParams) (repository.TicketType, error)
	GetTicketTypeById(ctx context.Context, id pgtype.UUID) (repository.TicketType, error)
	PublicGetAvailableTicketTypes(ctx context.Context, eventID pgtype.UUID) ([]repository.PublicGetAvailableTicketTypesRow, error)
	GetEventById(ctx context.Context, id pgtype.UUID) (repository.Event, error)
	UpdateTicketType(ctx context.Context, arg repository.UpdateTicketTypeParams) (repository.TicketType, error)
	DeleteTicketType(ctx context.Context, id pgtype.UUID) (repository.TicketType, error)
}

type PaymentQuerier interface {
	GetTicketTypeById(ctx context.Context, id pgtype.UUID) (repository.TicketType, error)
	CreateOrder(ctx context.Context, arg repository.CreateOrderParams) (repository.Order, error)
	GetOrderByPaymentRef(ctx context.Context, paymentRef pgtype.Text) (repository.Order, error)
	GetOrderById(ctx context.Context, id pgtype.UUID) (repository.Order, error)
	UpdateOrderStatus(ctx context.Context, arg repository.UpdateOrderStatusParams) (repository.Order, error)
	UpdateOrderPayment(ctx context.Context, arg repository.UpdateOrderPaymentParams) (repository.Order, error)
	UpdateOrderQRCode(ctx context.Context, arg repository.UpdateOrderQRCodeParams) (repository.Order, error)
	IncrementQuantitySold(ctx context.Context, arg repository.IncrementQuantitySoldParams) (pgtype.UUID, error)
	GetUserById(ctx context.Context, id pgtype.UUID) (repository.User, error)
	GetEventById(ctx context.Context, id pgtype.UUID) (repository.Event, error)
}

type PaymentDB interface {
	Queries() *repository.Queries
	WithTransaction(ctx context.Context, fn func(q *repository.Queries) error) error
}

type CheckInQuerier interface {
	GetEventById(ctx context.Context, id pgtype.UUID) (repository.Event, error)
	GetOrderByQRCode(ctx context.Context, qrCode pgtype.Text) (repository.Order, error)
	CheckInOrder(ctx context.Context, id pgtype.UUID) (repository.Order, error)
	GetCheckedInOrders(ctx context.Context, eventID pgtype.UUID) ([]repository.Order, error)
}

type OrganiserQuerier interface {
	GetEventsByOrganiser(ctx context.Context, organiserID pgtype.UUID) ([]repository.Event, error)
	GetTicketTypesByEvent(ctx context.Context, eventID pgtype.UUID) ([]repository.TicketType, error)
	GetTicketTypeSalesByEvent(ctx context.Context, eventID pgtype.UUID) ([]repository.GetTicketTypeSalesByEventRow, error)
	GetTotalTicketsSold(ctx context.Context, eventID pgtype.UUID) (int64, error)
	GetOrdersByEvent(ctx context.Context, arg repository.GetOrdersByEventParams) ([]repository.Order, error)
	GetOrdersByEventAndStatus(ctx context.Context, arg repository.GetOrdersByEventAndStatusParams) ([]repository.Order, error)
	GetEventRevenue(ctx context.Context, eventID pgtype.UUID) (int64, error)
	GetEventOrdersCount(ctx context.Context, eventID pgtype.UUID) (int64, error)
	GetEventCheckedInCount(ctx context.Context, eventID pgtype.UUID) (int64, error)
	GetEventOrderStatusBreakdown(ctx context.Context, eventID pgtype.UUID) ([]repository.GetEventOrderStatusBreakdownRow, error)
	GetEventTicketsSold(ctx context.Context, eventID pgtype.UUID) (int64, error)
	GetRecentEventOrders(ctx context.Context, arg repository.GetRecentEventOrdersParams) ([]repository.Order, error)
}

type AdminQuerier interface {
	// user management
	GetUserById(ctx context.Context, id pgtype.UUID) (repository.User, error)
	AdminGetAllUsers(ctx context.Context, arg repository.AdminGetAllUsersParams) ([]repository.User, error)
	AdminGetUserByRoleAndStatus(ctx context.Context, arg repository.AdminGetUserByRoleAndStatusParams) ([]repository.User, error)
	AdminGetUsersByRole(ctx context.Context, arg repository.AdminGetUsersByRoleParams) ([]repository.User, error)
	AdminGetUsersByStatus(ctx context.Context, arg repository.AdminGetUsersByStatusParams) ([]repository.User, error)
	AdminGetAllOrganisers(ctx context.Context, arg repository.AdminGetAllOrganisersParams) ([]repository.User, error)
	AdminGetPendingOrganisers(ctx context.Context, arg repository.AdminGetPendingOrganisersParams) ([]repository.User, error)
	AdminGetApprovedOrganisers(ctx context.Context, arg repository.AdminGetApprovedOrganisersParams) ([]repository.User, error)
	AdminUpdateUserVerification(ctx context.Context, arg repository.AdminUpdateUserVerificationParams) (repository.User, error)
	AdminBanUser(ctx context.Context, id pgtype.UUID) (repository.User, error)
	AdminUnbanUser(ctx context.Context, id pgtype.UUID) (repository.User, error)
	AdminSetUserRoleToAdmin(ctx context.Context, id pgtype.UUID) (repository.User, error)
	AdminDeleteUser(ctx context.Context, id pgtype.UUID) (repository.User, error)

	// event management
	AdminGetAllEvents(ctx context.Context, arg repository.AdminGetAllEventsParams) ([]repository.AdminGetAllEventsRow, error)
	AdminGetEventsByStatus(ctx context.Context, arg repository.AdminGetEventsByStatusParams) ([]repository.AdminGetEventsByStatusRow, error)
	AdminCancelEvent(ctx context.Context, id pgtype.UUID) (repository.Event, error)
	AdminDeleteEvent(ctx context.Context, id pgtype.UUID) (repository.Event, error)

	// order management
	AdminGetOrdersByStatus(ctx context.Context, arg repository.AdminGetOrdersByStatusParams) ([]repository.Order, error)
	AdminGetRecentOrdersWithDetails(ctx context.Context, limit int32) ([]repository.AdminGetRecentOrdersWithDetailsRow, error)
	AdminGetTotalRevenue(ctx context.Context) (int64, error)

	AdminGetPlatformStats(ctx context.Context) (repository.AdminGetPlatformStatsRow, error)
}
