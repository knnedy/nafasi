package service

import (
	"context"
	"errors"

	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
)

type AdminService struct {
	db       AdminQuerier
	validate *validator.Validate
	trans    ut.Translator
}

func NewAdminService(db AdminQuerier) *AdminService {
	validate, trans := newValidator()
	return &AdminService{
		db:       db,
		validate: validate,
		trans:    trans,
	}
}

func (s *AdminService) AdminGetAllUsers(ctx context.Context, limit, offset int32) ([]repository.User, error) {
	users, err := s.db.AdminGetAllUsers(ctx, repository.AdminGetAllUsersParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return users, nil
}

func (s *AdminService) AdminGetUserByRole(ctx context.Context, role repository.UserRole, limit, offset int32) ([]repository.User, error) {
	users, err := s.db.AdminGetUsersByRole(ctx, repository.AdminGetUsersByRoleParams{
		Role:   role,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return users, nil
}

func (s *AdminService) AdminGetUsersByStatus(ctx context.Context, status repository.UserStatus, limit, offset int32) ([]repository.User, error) {
	users, err := s.db.AdminGetUsersByStatus(ctx, repository.AdminGetUsersByStatusParams{
		Status: status,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return users, nil
}

func (s *AdminService) AdminGetUserById(ctx context.Context, targetUserID string) (repository.User, error) {
	targetParsedID, err := uuid.Parse(targetUserID)
	if err != nil {
		return repository.User{}, response.ErrInvalidInput
	}

	targetUser, err := s.db.AdminGetUserById(ctx, pgtype.UUID{Bytes: targetParsedID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.User{}, response.ErrNotFound
		}
		return repository.User{}, response.ErrDatabase
	}

	return targetUser, nil
}

func (s *AdminService) AdminGetPendingOrganisers(ctx context.Context) ([]repository.User, error) {
	pendingOrganisers, err := s.db.AdminGetPendingOrganisers(ctx)
	if err != nil {
		return nil, response.ErrDatabase
	}

	return pendingOrganisers, nil
}

func (s *AdminService) AdminGetApprovedOrganisers(ctx context.Context) ([]repository.User, error) {
	approvedOrganisers, err := s.db.AdminGetApprovedOrganisers(ctx)
	if err != nil {
		return nil, response.ErrDatabase
	}

	return approvedOrganisers, nil
}

func (s *AdminService) AdminUpdateUserVerification(ctx context.Context, targetUserID string, isVerified bool) (repository.User, error) {
	parsedID, err := uuid.Parse(targetUserID)
	if err != nil {
		return repository.User{}, response.ErrInvalidInput
	}

	verifiedUser, err := s.db.AdminUpdateUserVerification(ctx, repository.AdminUpdateUserVerificationParams{
		ID:         pgtype.UUID{Bytes: parsedID, Valid: true},
		IsVerified: isVerified,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.User{}, response.ErrNotFound
		}
		return repository.User{}, response.ErrDatabase
	}

	return verifiedUser, nil
}

func (s *AdminService) AdminBanUser(ctx context.Context, targetUserID string) (repository.User, error) {
	parsedID, err := uuid.Parse(targetUserID)
	if err != nil {
		return repository.User{}, response.ErrInvalidInput
	}

	bannedUser, err := s.db.AdminBanUser(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.User{}, response.ErrNotFound
		}
		return repository.User{}, response.ErrDatabase
	}

	return bannedUser, nil
}

func (s *AdminService) AdminUnbanUser(ctx context.Context, targetUserID string) (repository.User, error) {
	parsedID, err := uuid.Parse(targetUserID)
	if err != nil {
		return repository.User{}, response.ErrInvalidInput
	}

	unbannedUser, err := s.db.AdminUnbanUser(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.User{}, response.ErrNotFound
		}
		return repository.User{}, response.ErrDatabase
	}

	return unbannedUser, nil
}

func (s *AdminService) AdminSetUserRoleToAdmin(ctx context.Context, targetUserID string) (repository.User, error) {
	parsedID, err := uuid.Parse(targetUserID)
	if err != nil {
		return repository.User{}, response.ErrInvalidInput
	}

	adminUser, err := s.db.AdminSetUserRoleToAdmin(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.User{}, response.ErrNotFound
		}
		return repository.User{}, response.ErrDatabase
	}

	return adminUser, nil
}

func (s *AdminService) AdminDeleteUser(ctx context.Context, targetUserID string) (repository.User, error) {
	parsedID, err := uuid.Parse(targetUserID)
	if err != nil {
		return repository.User{}, response.ErrInvalidInput
	}

	deletedUser, err := s.db.AdminDeleteUser(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.User{}, response.ErrNotFound
		}
		return repository.User{}, response.ErrDatabase
	}

	return deletedUser, nil
}

func (s *AdminService) AdminGetAllEvents(ctx context.Context, limit, offset int32) ([]repository.AdminGetAllEventsRow, error) {
	events, err := s.db.AdminGetAllEvents(ctx, repository.AdminGetAllEventsParams{
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return events, nil
}

func (s *AdminService) AdminGetEventsByStatus(ctx context.Context, status repository.EventStatus, limit, offset int32) ([]repository.AdminGetEventsByStatusRow, error) {
	events, err := s.db.AdminGetEventsByStatus(ctx, repository.AdminGetEventsByStatusParams{
		Status: status,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return events, nil
}

func (s *AdminService) AdminCancelEvent(ctx context.Context, targetEventID string) (repository.Event, error) {
	parsedID, err := uuid.Parse(targetEventID)
	if err != nil {
		return repository.Event{}, response.ErrInvalidInput
	}

	canceledEvent, err := s.db.AdminCancelEvent(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.Event{}, response.ErrNotFound
		}
		return repository.Event{}, response.ErrDatabase
	}

	return canceledEvent, nil
}

func (s *AdminService) AdminDeleteEvent(ctx context.Context, targetEventID string) (repository.Event, error) {
	parsedID, err := uuid.Parse(targetEventID)
	if err != nil {
		return repository.Event{}, response.ErrInvalidInput
	}

	deletedEvent, err := s.db.AdminDeleteEvent(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return repository.Event{}, response.ErrNotFound
		}
		return repository.Event{}, response.ErrDatabase
	}

	return deletedEvent, nil
}

func (s *AdminService) AdminGetOrdersByStatus(ctx context.Context, status repository.OrderStatus, limit, offset int32) ([]repository.Order, error) {
	orders, err := s.db.AdminGetOrdersByStatus(ctx, repository.AdminGetOrdersByStatusParams{
		Status: status,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return nil, response.ErrDatabase
	}

	return orders, nil
}

func (s *AdminService) AdminGetRecentOrdersWithDetails(ctx context.Context, limit int32) ([]repository.AdminGetRecentOrdersWithDetailsRow, error) {
	orders, err := s.db.AdminGetRecentOrdersWithDetails(ctx, limit)
	if err != nil {
		return nil, response.ErrDatabase
	}

	return orders, nil
}

func (s *AdminService) AdminGetTotalRevenue(ctx context.Context) (int64, error) {
	totalRevenue, err := s.db.AdminGetTotalRevenue(ctx)
	if err != nil {
		return 0, response.ErrDatabase
	}

	return totalRevenue, nil
}

func (s *AdminService) AdminGetPlatformStats(ctx context.Context) (repository.AdminGetPlatformStatsRow, error) {
	platformStats, err := s.db.AdminGetPlatformStats(ctx)
	if err != nil {
		return repository.AdminGetPlatformStatsRow{}, response.ErrDatabase
	}

	return platformStats, nil
}
