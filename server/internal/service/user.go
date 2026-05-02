package service

import (
	"context"

	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	db       UserQuerier
	validate *validator.Validate
	trans    ut.Translator
}

func NewUserService(db UserQuerier) *UserService {
	validate, trans := newValidator()
	return &UserService{
		db:       db,
		validate: validate,
		trans:    trans,
	}
}

type UpdateProfileInput struct {
	Name  string `validate:"required,min=2,max=100"`
	Email string `validate:"required,email"`
}

type UpdatePasswordInput struct {
	CurrentPassword string `validate:"required,min=8,max=100,has_upper,has_lower,has_number,has_special"`
	NewPassword     string `validate:"required,min=8,max=100,nefield=CurrentPassword,has_upper,has_lower,has_number,has_special"`
}

type UpdateAvatarInput struct {
	AvatarURL string `validate:"required,url"`
}

func (s *UserService) GetMe(ctx context.Context, userID string) (repository.User, error) {
	// parse user ID
	parsedID, err := uuid.Parse(userID)
	if err != nil {
		return repository.User{}, response.ErrNotFound
	}

	// get user from DB
	user, err := s.db.GetUserById(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		return repository.User{}, response.ErrNotFound
	}

	return user, nil
}

func (s *UserService) UpdateProfile(ctx context.Context, userID string, input UpdateProfileInput) (repository.User, error) {
	// validate input
	if err := s.validate.Struct(input); err != nil {
		return repository.User{}, formatValidationError(err, s.trans)
	}

	// parse user ID
	parsedID, err := uuid.Parse(userID)
	if err != nil {
		return repository.User{}, response.ErrNotFound
	}

	// check if email is already taken by another user
	existing, err := s.db.GetUserByEmail(ctx, input.Email)
	if err == nil && existing.ID.Bytes != parsedID {
		return repository.User{}, response.ErrAlreadyExists
	}

	// update profile
	user, err := s.db.UpdateUserProfile(ctx, repository.UpdateUserProfileParams{
		ID:    pgtype.UUID{Bytes: parsedID, Valid: true},
		Name:  input.Name,
		Email: input.Email,
	})
	if err != nil {
		return repository.User{}, response.ErrDatabase
	}

	return user, nil
}

func (s *UserService) UpdatePassword(ctx context.Context, userID string, input UpdatePasswordInput) error {
	// validate input
	if err := s.validate.Struct(input); err != nil {
		return formatValidationError(err, s.trans)
	}

	// parse user ID
	parsedID, err := uuid.Parse(userID)
	if err != nil {
		return response.ErrNotFound
	}

	// get user from DB
	user, err := s.db.GetUserById(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		return response.ErrNotFound
	}

	// verify current password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.CurrentPassword))
	if err != nil {
		return response.ErrInvalidCredentials
	}

	// hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return response.ErrInternal
	}

	// update password in DB
	_, err = s.db.UpdateUserPassword(ctx, repository.UpdateUserPasswordParams{
		ID:       pgtype.UUID{Bytes: parsedID, Valid: true},
		Password: string(hashedPassword),
	})
	if err != nil {
		return response.ErrDatabase
	}

	return nil
}

func (s *UserService) UpdateAvatar(ctx context.Context, userID string, input UpdateAvatarInput) (repository.User, error) {
	if err := s.validate.Struct(input); err != nil {
		return repository.User{}, formatValidationError(err, s.trans)
	}

	parsedID, err := uuid.Parse(userID)
	if err != nil {
		return repository.User{}, response.ErrNotFound
	}

	user, err := s.db.UpdateUserAvatar(ctx, repository.UpdateUserAvatarParams{
		ID:        pgtype.UUID{Bytes: parsedID, Valid: true},
		AvatarUrl: pgtype.Text{String: input.AvatarURL, Valid: true},
	})
	if err != nil {
		return repository.User{}, response.ErrDatabase
	}

	return user, nil
}

func (s *UserService) DeleteMe(ctx context.Context, userID string) (repository.User, error) {
	// parse user ID
	parsedID, err := uuid.Parse(userID)
	if err != nil {
		return repository.User{}, response.ErrNotFound
	}

	// delete user from DB
	user, err := s.db.DeleteUser(ctx, pgtype.UUID{Bytes: parsedID, Valid: true})
	if err != nil {
		return repository.User{}, response.ErrDatabase
	}

	return user, nil
}
