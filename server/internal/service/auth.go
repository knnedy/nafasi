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
	db        *repository.Queries
	tokens    *token.TokenManager
	email     *notifications.EmailService
	clientURL string
	validate  *validator.Validate
	trans     ut.Translator
}

func NewAuthService(db *repository.Queries, tokens *token.TokenManager, email *notifications.EmailService, clientURL string) *AuthService {
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
	Name     string `validate:"required,min=2,max=100"`
	Email    string `validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=100,has_upper,has_lower,has_number,has_special"`
}

type LoginInput struct {
	Email    string `validate:"required,email"`
	Password string `validate:"required"`
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

// generateAuthTokens is a shared helper that generates both tokens and saves the refresh token
func (s *AuthService) generateAuthTokens(ctx context.Context, user repository.User) (AuthResult, error) {
	// generate access token
	accessToken, err := s.tokens.GenerateAccessToken(user.ID.String())
	if err != nil {
		return AuthResult{}, response.ErrInternal
	}

	// generate refresh token
	refreshToken, err := s.tokens.GenerateRefreshToken(
		uuid.UUID(user.ID.Bytes),
	)
	if err != nil {
		return AuthResult{}, response.ErrInternal
	}

	// save refresh token to DB
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
	// validate input
	if err := s.validate.Struct(input); err != nil {
		return AuthResult{}, formatValidationError(err, s.trans)
	}

	// check if email already exists
	_, err := s.db.GetUserByEmail(ctx, input.Email)
	if err == nil {
		return AuthResult{}, response.ErrEmailAlreadyExists
	}

	// hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return AuthResult{}, response.ErrInternal
	}

	// create user
	user, err := s.db.CreateUser(ctx, repository.CreateUserParams{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashedPassword),
	})
	if err != nil {
		return AuthResult{}, response.ErrDatabase
	}

	return s.generateAuthTokens(ctx, user)
}

func (s *AuthService) Login(ctx context.Context, input LoginInput) (AuthResult, error) {
	// validate input
	if err := s.validate.Struct(input); err != nil {
		return AuthResult{}, formatValidationError(err, s.trans)
	}

	// get user by email
	user, err := s.db.GetUserByEmail(ctx, input.Email)
	if err != nil {
		return AuthResult{}, response.ErrInvalidCredentials
	}

	// compare password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		return AuthResult{}, response.ErrInvalidCredentials
	}

	return s.generateAuthTokens(ctx, user)
}

func (s *AuthService) RefreshAccessToken(ctx context.Context, refreshToken string) (AuthResult, error) {
	// validate refresh token exists and is not revoked or expired
	dbToken, err := s.db.GetRefreshToken(ctx, refreshToken)
	if err != nil {
		return AuthResult{}, response.ErrInvalidToken
	}

	// revoke current refresh token - rotation
	if err := s.db.RevokeRefreshToken(ctx, refreshToken); err != nil {
		return AuthResult{}, response.ErrDatabase
	}

	// get user
	user, err := s.db.GetUserById(ctx, dbToken.UserID)
	if err != nil {
		return AuthResult{}, response.ErrNotFound
	}

	return s.generateAuthTokens(ctx, user)
}

func (s *AuthService) ForgotPassword(ctx context.Context, input ForgotPasswordInput) error {
	if err := s.validate.Struct(input); err != nil {
		return formatValidationError(err, s.trans)
	}

	// check if user exists
	user, err := s.db.GetUserByEmail(ctx, input.Email)
	if err != nil {
		// for security, don't reveal if email doesn't exist
		return nil
	}

	// delete any existing reset tokens for this user
	if err := s.db.DeleteUserPasswordResetTokens(ctx, user.ID); err != nil {
		return response.ErrDatabase
	}

	// generate reset token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return response.ErrInternal
	}
	resetToken := hex.EncodeToString(tokenBytes)

	// save reset token to DB - expires in 1 hour
	if _, err := s.db.CreatePasswordResetToken(ctx, repository.CreatePasswordResetTokenParams{
		UserID:    user.ID,
		Token:     resetToken,
		ExpiresAt: pgtype.Timestamp{Time: time.Now().Add(1 * time.Hour), Valid: true},
	}); err != nil {
		return response.ErrDatabase
	}

	// send reset email
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

	// validate reset token
	resetToken, err := s.db.GetPasswordResetToken(ctx, input.Token)
	if err != nil || resetToken.ExpiresAt.Time.Before(time.Now()) {
		return response.ErrInvalidToken
	}

	// hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return response.ErrInternal
	}

	// update user's password
	if _, err := s.db.UpdateUserPassword(ctx, repository.UpdateUserPasswordParams{
		ID:       resetToken.UserID,
		Password: string(hashedPassword),
	}); err != nil {
		return response.ErrDatabase
	}

	// mark reset token as used
	if err := s.db.MarkPasswordResetTokenUsed(ctx, input.Token); err != nil {
		return response.ErrDatabase
	}

	// revoke all existing refresh tokens for this user (force logout)
	if err := s.db.RevokeAllUserTokens(ctx, resetToken.UserID); err != nil {
		return response.ErrDatabase
	}

	return nil
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	// revoke refresh token
	if err := s.db.RevokeRefreshToken(ctx, refreshToken); err != nil {
		return response.ErrDatabase
	}
	return nil
}
