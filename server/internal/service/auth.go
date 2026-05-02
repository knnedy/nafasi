package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log/slog"
	"time"

	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/notifications"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/token"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	db        AuthQuerier
	tokens    *token.TokenManager
	email     *notifications.EmailService
	clientURL string
	validate  *validator.Validate
	trans     ut.Translator
}

func NewAuthService(db AuthQuerier, tokens *token.TokenManager, email *notifications.EmailService, clientURL string) *AuthService {
	validate, trans := newValidator()
	return &AuthService{
		db:        db,
		tokens:    tokens,
		email:     email,
		clientURL: clientURL,
		validate:  validate,
		trans:     trans,
	}
}

type RegisterInput struct {
	Name     string `json:"name"     validate:"required,min=2,max=100"`
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=100,has_upper,has_lower,has_number,has_special"`
}

type RegisterOrganiserInput struct {
	Name     string `json:"name"     validate:"required,min=2,max=100"`
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=100,has_upper,has_lower,has_number,has_special"`
}

type LoginInput struct {
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type ForgotPasswordInput struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordInput struct {
	Token       string `json:"token"        validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8,max=100,has_upper,has_lower,has_number,has_special"`
}

type AuthResult struct {
	User         repository.User
	AccessToken  string
	RefreshToken string
}

func (s *AuthService) generateAuthTokens(ctx context.Context, user repository.User) (AuthResult, error) {
	accessToken, err := s.tokens.GenerateAccessToken(
		uuid.UUID(user.ID.Bytes).String(),
		string(user.Role),
	)
	if err != nil {
		return AuthResult{}, response.ErrInternal
	}

	refreshToken, err := s.tokens.GenerateRefreshToken(
		uuid.UUID(user.ID.Bytes),
	)
	if err != nil {
		return AuthResult{}, response.ErrInternal
	}

	_, err = s.db.CreateRefreshToken(ctx, repository.CreateRefreshTokenParams{
		UserID:    pgtype.UUID{Bytes: refreshToken.UserID, Valid: true},
		Token:     refreshToken.Token,
		ExpiresAt: pgtype.Timestamp{Time: refreshToken.ExpiresAt, Valid: true},
	})
	if err != nil {
		return AuthResult{}, response.ErrDatabase
	}

	return AuthResult{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken.Token,
	}, nil
}

func (s *AuthService) Register(ctx context.Context, input RegisterInput) (AuthResult, error) {
	if err := s.validate.Struct(input); err != nil {
		return AuthResult{}, formatValidationError(err, s.trans)
	}

	_, err := s.db.GetUserByEmail(ctx, input.Email)
	if err == nil {
		return AuthResult{}, response.ErrEmailAlreadyExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return AuthResult{}, response.ErrInternal
	}

	user, err := s.db.CreateUser(ctx, repository.CreateUserParams{
		Name:       input.Name,
		Email:      input.Email,
		Password:   string(hashedPassword),
		Role:       repository.UserRoleATTENDEE,
		IsVerified: true,
	})
	if err != nil {
		return AuthResult{}, response.ErrDatabase
	}

	return s.generateAuthTokens(ctx, user)
}

func (s *AuthService) RegisterOrganiser(ctx context.Context, input RegisterOrganiserInput) (AuthResult, error) {
	if err := s.validate.Struct(input); err != nil {
		return AuthResult{}, formatValidationError(err, s.trans)
	}

	_, err := s.db.GetUserByEmail(ctx, input.Email)
	if err == nil {
		return AuthResult{}, response.ErrEmailAlreadyExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return AuthResult{}, response.ErrInternal
	}

	user, err := s.db.CreateUser(ctx, repository.CreateUserParams{
		Name:       input.Name,
		Email:      input.Email,
		Password:   string(hashedPassword),
		Role:       repository.UserRoleORGANISER,
		IsVerified: false,
	})
	if err != nil {
		return AuthResult{}, response.ErrDatabase
	}

	// notify organiser their account is pending approval
	// non-critical — log and continue if email fails
	if err := s.email.SendOrganiserApprovalPending(user.Email, user.Name); err != nil {
		slog.Error("failed to send organiser pending approval email",
			"user_id", uuid.UUID(user.ID.Bytes).String(),
			"err", err,
		)
	}

	// return user but no tokens — organiser cannot log in until approved
	return AuthResult{User: user}, nil
}

func (s *AuthService) Login(ctx context.Context, input LoginInput) (AuthResult, error) {
	if err := s.validate.Struct(input); err != nil {
		return AuthResult{}, formatValidationError(err, s.trans)
	}

	user, err := s.db.GetUserByEmail(ctx, input.Email)
	if err != nil {
		return AuthResult{}, response.ErrInvalidCredentials
	}

	if user.Status == repository.UserStatusBANNED {
		return AuthResult{}, response.ErrUserBanned
	}

	if user.Role == repository.UserRoleORGANISER && !user.IsVerified {
		return AuthResult{}, response.ErrOrganiserNotVerified
	}

	if err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return AuthResult{}, response.ErrInvalidCredentials
	}

	return s.generateAuthTokens(ctx, user)
}

func (s *AuthService) RefreshAccessToken(ctx context.Context, refreshToken string) (AuthResult, error) {
	dbToken, err := s.db.GetRefreshToken(ctx, refreshToken)
	if err != nil {
		return AuthResult{}, response.ErrInvalidToken
	}

	if err := s.db.RevokeRefreshToken(ctx, refreshToken); err != nil {
		return AuthResult{}, response.ErrDatabase
	}

	user, err := s.db.GetUserById(ctx, dbToken.UserID)
	if err != nil {
		return AuthResult{}, response.ErrNotFound
	}

	// re-check ban and verification on refresh
	if user.Status == repository.UserStatusBANNED {
		return AuthResult{}, response.ErrUserBanned
	}

	if user.Role == repository.UserRoleORGANISER && !user.IsVerified {
		return AuthResult{}, response.ErrOrganiserNotVerified
	}

	return s.generateAuthTokens(ctx, user)
}

func (s *AuthService) ForgotPassword(ctx context.Context, input ForgotPasswordInput) error {
	if err := s.validate.Struct(input); err != nil {
		return formatValidationError(err, s.trans)
	}

	user, err := s.db.GetUserByEmail(ctx, input.Email)
	if err != nil {
		// don't reveal whether email exists
		return nil
	}

	if err := s.db.DeleteUserPasswordResetTokens(ctx, user.ID); err != nil {
		return response.ErrDatabase
	}

	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return response.ErrInternal
	}
	resetToken := hex.EncodeToString(tokenBytes)

	if _, err := s.db.CreatePasswordResetToken(ctx, repository.CreatePasswordResetTokenParams{
		UserID:    user.ID,
		Token:     resetToken,
		ExpiresAt: pgtype.Timestamp{Time: time.Now().Add(time.Hour), Valid: true},
	}); err != nil {
		return response.ErrDatabase
	}

	resetURL := fmt.Sprintf("%s/reset-password?token=%s", s.clientURL, resetToken)
	if err := s.email.SendPasswordReset(user.Email, resetURL); err != nil {
		slog.Error("failed to send password reset email",
			"user_id", uuid.UUID(user.ID.Bytes).String(),
			"err", err,
		)
	}

	return nil
}

func (s *AuthService) ResetPassword(ctx context.Context, input ResetPasswordInput) error {
	if err := s.validate.Struct(input); err != nil {
		return formatValidationError(err, s.trans)
	}

	resetToken, err := s.db.GetPasswordResetToken(ctx, input.Token)
	if err != nil || resetToken.ExpiresAt.Time.Before(time.Now()) {
		return response.ErrInvalidToken
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return response.ErrInternal
	}

	if _, err := s.db.UpdateUserPassword(ctx, repository.UpdateUserPasswordParams{
		ID:       resetToken.UserID,
		Password: string(hashedPassword),
	}); err != nil {
		return response.ErrDatabase
	}

	if err := s.db.MarkPasswordResetTokenUsed(ctx, input.Token); err != nil {
		return response.ErrDatabase
	}

	if err := s.db.RevokeAllUserTokens(ctx, resetToken.UserID); err != nil {
		return response.ErrDatabase
	}

	return nil
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	if err := s.db.RevokeRefreshToken(ctx, refreshToken); err != nil {
		return response.ErrDatabase
	}
	return nil
}
