package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/repository/mock"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/knnedy/nafasi/internal/token"
	"github.com/stretchr/testify/assert"
	mocktestify "github.com/stretchr/testify/mock"
	"golang.org/x/crypto/bcrypt"
)

func newTestAuthService(db *mock.Queries) *service.AuthService {
	tokens := token.NewTokenManager("test-secret-that-is-long-enough")
	return service.NewAuthService(db, tokens, nil, "http://localhost:3000")
}

func makeUserID() pgtype.UUID {
	id := uuid.New()
	return pgtype.UUID{Bytes: id, Valid: true}
}

// Register
func TestRegister_Success(t *testing.T) {
	db := new(mock.Queries)
	svc := newTestAuthService(db)

	userID := makeUserID()

	db.On("GetUserByEmail", mocktestify.Anything, "john@example.com").
		Return(repository.User{}, errors.New("not found"))

	db.On("CreateUser", mocktestify.Anything, mocktestify.MatchedBy(func(p repository.CreateUserParams) bool {
		return p.Email == "john@example.com" && p.Name == "John Doe"
	})).Return(repository.User{
		ID:    userID,
		Name:  "John Doe",
		Email: "john@example.com",
	}, nil)

	db.On("CreateRefreshToken", mocktestify.Anything, mocktestify.Anything).
		Return(repository.RefreshToken{
			ID:        pgtype.UUID{Bytes: uuid.New(), Valid: true},
			UserID:    userID,
			Token:     uuid.New().String(),
			ExpiresAt: pgtype.Timestamp{Time: time.Now().Add(7 * 24 * time.Hour), Valid: true},
		}, nil)

	result, err := svc.Register(context.Background(), service.RegisterInput{
		Name:     "John Doe",
		Email:    "john@example.com",
		Password: "Password1!",
	})

	assert.NoError(t, err)
	assert.NotEmpty(t, result.AccessToken)
	assert.NotEmpty(t, result.RefreshToken)
	assert.Equal(t, "john@example.com", result.User.Email)
	db.AssertExpectations(t)
}

func TestRegister_EmailAlreadyExists(t *testing.T) {
	db := new(mock.Queries)
	svc := newTestAuthService(db)

	db.On("GetUserByEmail", mocktestify.Anything, "john@example.com").
		Return(repository.User{ID: makeUserID()}, nil)

	_, err := svc.Register(context.Background(), service.RegisterInput{
		Name:     "John Doe",
		Email:    "john@example.com",
		Password: "Password1!",
	})

	assert.ErrorIs(t, err, response.ErrEmailAlreadyExists)
	db.AssertExpectations(t)
}

func TestRegister_WeakPassword(t *testing.T) {
	db := new(mock.Queries)
	svc := newTestAuthService(db)

	tests := []struct {
		name     string
		password string
	}{
		{"no uppercase", "password1!"},
		{"no lowercase", "PASSWORD1!"},
		{"no number", "Password!!"},
		{"no special", "Password11"},
		{"too short", "Pa1!"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := svc.Register(context.Background(), service.RegisterInput{
				Name:     "John Doe",
				Email:    "john@example.com",
				Password: tt.password,
			})
			assert.Error(t, err)
		})
	}
}

func TestRegister_InvalidEmail(t *testing.T) {
	db := new(mock.Queries)
	svc := newTestAuthService(db)

	_, err := svc.Register(context.Background(), service.RegisterInput{
		Name:     "John Doe",
		Email:    "not-an-email",
		Password: "Password1!",
	})

	assert.Error(t, err)
}

// Login
func TestLogin_Success(t *testing.T) {
	db := new(mock.Queries)
	svc := newTestAuthService(db)

	userID := makeUserID()

	// pre-hash a known password
	hashedPassword := mustHash("Password1!")

	db.On("GetUserByEmail", mocktestify.Anything, "john@example.com").
		Return(repository.User{
			ID:       userID,
			Email:    "john@example.com",
			Password: hashedPassword,
		}, nil)

	db.On("CreateRefreshToken", mocktestify.Anything, mocktestify.Anything).
		Return(repository.RefreshToken{
			ID:        pgtype.UUID{Bytes: uuid.New(), Valid: true},
			UserID:    userID,
			Token:     uuid.New().String(),
			ExpiresAt: pgtype.Timestamp{Time: time.Now().Add(7 * 24 * time.Hour), Valid: true},
		}, nil)

	result, err := svc.Login(context.Background(), service.LoginInput{
		Email:    "john@example.com",
		Password: "Password1!",
	})

	assert.NoError(t, err)
	assert.NotEmpty(t, result.AccessToken)
	assert.NotEmpty(t, result.RefreshToken)
	db.AssertExpectations(t)
}

func TestLogin_WrongPassword(t *testing.T) {
	db := new(mock.Queries)
	svc := newTestAuthService(db)

	db.On("GetUserByEmail", mocktestify.Anything, "john@example.com").
		Return(repository.User{
			ID:       makeUserID(),
			Email:    "john@example.com",
			Password: mustHash("Password1!"),
		}, nil)

	_, err := svc.Login(context.Background(), service.LoginInput{
		Email:    "john@example.com",
		Password: "WrongPassword1!",
	})

	assert.ErrorIs(t, err, response.ErrInvalidCredentials)
	db.AssertExpectations(t)
}

func TestLogin_UserNotFound(t *testing.T) {
	db := new(mock.Queries)
	svc := newTestAuthService(db)

	db.On("GetUserByEmail", mocktestify.Anything, "nobody@example.com").
		Return(repository.User{}, errors.New("not found"))

	_, err := svc.Login(context.Background(), service.LoginInput{
		Email:    "nobody@example.com",
		Password: "Password1!",
	})

	assert.ErrorIs(t, err, response.ErrInvalidCredentials)
	db.AssertExpectations(t)
}

// Logout
func TestLogout_Success(t *testing.T) {
	db := new(mock.Queries)
	svc := newTestAuthService(db)

	token := uuid.New().String()

	db.On("RevokeRefreshToken", mocktestify.Anything, token).
		Return(nil)

	err := svc.Logout(context.Background(), token)

	assert.NoError(t, err)
	db.AssertExpectations(t)
}

func TestLogout_DatabaseError(t *testing.T) {
	db := new(mock.Queries)
	svc := newTestAuthService(db)

	token := uuid.New().String()

	db.On("RevokeRefreshToken", mocktestify.Anything, token).
		Return(errors.New("db error"))

	err := svc.Logout(context.Background(), token)

	assert.ErrorIs(t, err, response.ErrDatabase)
	db.AssertExpectations(t)
}

// RefreshAccessToken
func TestRefreshAccessToken_Success(t *testing.T) {
	db := new(mock.Queries)
	svc := newTestAuthService(db)

	userID := makeUserID()
	refreshToken := uuid.New().String()

	db.On("GetRefreshToken", mocktestify.Anything, refreshToken).
		Return(repository.RefreshToken{
			ID:        pgtype.UUID{Bytes: uuid.New(), Valid: true},
			UserID:    userID,
			Token:     refreshToken,
			ExpiresAt: pgtype.Timestamp{Time: time.Now().Add(7 * 24 * time.Hour), Valid: true},
		}, nil)

	db.On("RevokeRefreshToken", mocktestify.Anything, refreshToken).
		Return(nil)

	db.On("GetUserById", mocktestify.Anything, userID).
		Return(repository.User{
			ID:    userID,
			Email: "john@example.com",
		}, nil)

	db.On("CreateRefreshToken", mocktestify.Anything, mocktestify.Anything).
		Return(repository.RefreshToken{
			ID:        pgtype.UUID{Bytes: uuid.New(), Valid: true},
			UserID:    userID,
			Token:     uuid.New().String(),
			ExpiresAt: pgtype.Timestamp{Time: time.Now().Add(7 * 24 * time.Hour), Valid: true},
		}, nil)

	result, err := svc.RefreshAccessToken(context.Background(), refreshToken)

	assert.NoError(t, err)
	assert.NotEmpty(t, result.AccessToken)
	assert.NotEmpty(t, result.RefreshToken)
	assert.NotEqual(t, refreshToken, result.RefreshToken)
	db.AssertExpectations(t)
}

func TestRefreshAccessToken_InvalidToken(t *testing.T) {
	db := new(mock.Queries)
	svc := newTestAuthService(db)

	db.On("GetRefreshToken", mocktestify.Anything, "invalid-token").
		Return(repository.RefreshToken{}, errors.New("not found"))

	_, err := svc.RefreshAccessToken(context.Background(), "invalid-token")

	assert.ErrorIs(t, err, response.ErrInvalidToken)
	db.AssertExpectations(t)
}

// helpers
func mustHash(password string) string {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		panic(err)
	}
	return string(hash)
}
