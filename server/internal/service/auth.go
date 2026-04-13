package service

import (
	"context"

	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/token"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	db       *repository.Queries
	tokens   *token.TokenManager
	validate *validator.Validate
	trans    ut.Translator
}

func NewAuthService(db *repository.Queries, tokens *token.TokenManager) *AuthService {
	validate, trans := newValidator()
	return &AuthService{
		db:       db,
		tokens:   tokens,
		validate: validate,
		trans:    trans,
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

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	// revoke refresh token
	if err := s.db.RevokeRefreshToken(ctx, refreshToken); err != nil {
		return response.ErrDatabase
	}
	return nil
}
