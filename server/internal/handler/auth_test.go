package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/handler"
	"github.com/knnedy/nafasi/internal/handler/mock"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/assert"
	mocktestify "github.com/stretchr/testify/mock"
)

func makeAuthResult() service.AuthResult {
	return service.AuthResult{
		User: repository.User{
			ID:    pgtype.UUID{Bytes: uuid.New(), Valid: true},
			Name:  "John Doe",
			Email: "john@example.com",
			Role:  repository.UserRoleATTENDEE,
		},
		AccessToken:  "test-access-token",
		RefreshToken: "test-refresh-token",
	}
}

func toJSON(t *testing.T, v any) *bytes.Buffer {
	t.Helper()
	b, err := json.Marshal(v)
	assert.NoError(t, err)
	return bytes.NewBuffer(b)
}

func getRefreshCookie(cookies []*http.Cookie) *http.Cookie {
	for _, c := range cookies {
		if c.Name == "refresh_token" {
			return c
		}
	}
	return nil
}

// Register
func TestRegisterHandler_Success(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	input := service.RegisterInput{
		Name:     "John Doe",
		Email:    "john@example.com",
		Password: "Password1!",
	}

	svc.On("Register", mocktestify.Anything, input).
		Return(makeAuthResult(), nil)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", toJSON(t, input))
	r.Header.Set("Content-Type", "application/json")

	h.Register(w, r)

	assert.Equal(t, http.StatusCreated, w.Code)

	var resp map[string]any
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.True(t, resp["success"].(bool))

	cookie := getRefreshCookie(w.Result().Cookies())
	assert.NotNil(t, cookie)
	assert.Equal(t, "test-refresh-token", cookie.Value)
	assert.True(t, cookie.HttpOnly)

	svc.AssertExpectations(t)
}

func TestRegisterHandler_EmailAlreadyExists(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	input := service.RegisterInput{
		Name:     "John Doe",
		Email:    "john@example.com",
		Password: "Password1!",
	}

	svc.On("Register", mocktestify.Anything, input).
		Return(service.AuthResult{}, response.ErrEmailAlreadyExists)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", toJSON(t, input))
	r.Header.Set("Content-Type", "application/json")

	h.Register(w, r)

	assert.Equal(t, http.StatusConflict, w.Code)

	var resp map[string]any
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.False(t, resp["success"].(bool))

	svc.AssertExpectations(t)
}

func TestRegisterHandler_InvalidBody(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBufferString("not json"))
	r.Header.Set("Content-Type", "application/json")

	h.Register(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

// Login
func TestLoginHandler_Success(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	input := service.LoginInput{
		Email:    "john@example.com",
		Password: "Password1!",
	}

	svc.On("Login", mocktestify.Anything, input).
		Return(makeAuthResult(), nil)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", toJSON(t, input))
	r.Header.Set("Content-Type", "application/json")

	h.Login(w, r)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]any
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.True(t, resp["success"].(bool))

	cookie := getRefreshCookie(w.Result().Cookies())
	assert.NotNil(t, cookie)
	assert.Equal(t, "test-refresh-token", cookie.Value)

	svc.AssertExpectations(t)
}

func TestLoginHandler_InvalidCredentials(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	input := service.LoginInput{
		Email:    "john@example.com",
		Password: "WrongPassword1!",
	}

	svc.On("Login", mocktestify.Anything, input).
		Return(service.AuthResult{}, response.ErrInvalidCredentials)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", toJSON(t, input))
	r.Header.Set("Content-Type", "application/json")

	h.Login(w, r)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	svc.AssertExpectations(t)
}

func TestLoginHandler_InvalidBody(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBufferString("not json"))
	r.Header.Set("Content-Type", "application/json")

	h.Login(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

// RefreshAccessToken
func TestRefreshAccessTokenHandler_Success(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	svc.On("RefreshAccessToken", mocktestify.Anything, "old-refresh-token").
		Return(makeAuthResult(), nil)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", nil)
	r.AddCookie(&http.Cookie{Name: "refresh_token", Value: "old-refresh-token"})

	h.RefreshAccessToken(w, r)

	assert.Equal(t, http.StatusOK, w.Code)

	cookie := getRefreshCookie(w.Result().Cookies())
	assert.NotNil(t, cookie)
	assert.Equal(t, "test-refresh-token", cookie.Value)

	svc.AssertExpectations(t)
}

func TestRefreshAccessTokenHandler_MissingCookie(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", nil)

	h.RefreshAccessToken(w, r)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestRefreshAccessTokenHandler_InvalidToken(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	svc.On("RefreshAccessToken", mocktestify.Anything, "invalid-token").
		Return(service.AuthResult{}, response.ErrInvalidToken)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", nil)
	r.AddCookie(&http.Cookie{Name: "refresh_token", Value: "invalid-token"})

	h.RefreshAccessToken(w, r)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	svc.AssertExpectations(t)
}

// ForgotPassword
func TestForgotPasswordHandler_Success(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	input := service.ForgotPasswordInput{
		Email: "john@example.com",
	}

	svc.On("ForgotPassword", mocktestify.Anything, input).
		Return(nil)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/forgot-password", toJSON(t, input))
	r.Header.Set("Content-Type", "application/json")

	h.ForgotPassword(w, r)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]any
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.True(t, resp["success"].(bool))

	svc.AssertExpectations(t)
}

func TestForgotPasswordHandler_InvalidBody(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/forgot-password", bytes.NewBufferString("not json"))
	r.Header.Set("Content-Type", "application/json")

	h.ForgotPassword(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

// ResetPassword
func TestResetPasswordHandler_Success(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	input := service.ResetPasswordInput{
		Token:       "valid-reset-token",
		NewPassword: "NewPassword1!",
	}

	svc.On("ResetPassword", mocktestify.Anything, input).
		Return(nil)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/reset-password", toJSON(t, input))
	r.Header.Set("Content-Type", "application/json")

	h.ResetPassword(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestResetPasswordHandler_InvalidToken(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	input := service.ResetPasswordInput{
		Token:       "invalid-token",
		NewPassword: "NewPassword1!",
	}

	svc.On("ResetPassword", mocktestify.Anything, input).
		Return(response.ErrInvalidToken)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/reset-password", toJSON(t, input))
	r.Header.Set("Content-Type", "application/json")

	h.ResetPassword(w, r)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	svc.AssertExpectations(t)
}

// Logout
func TestLogoutHandler_Success(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	svc.On("Logout", mocktestify.Anything, "test-refresh-token").
		Return(nil)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", nil)
	r.AddCookie(&http.Cookie{Name: "refresh_token", Value: "test-refresh-token"})

	h.Logout(w, r)

	assert.Equal(t, http.StatusOK, w.Code)

	cookie := getRefreshCookie(w.Result().Cookies())
	assert.NotNil(t, cookie)
	assert.Equal(t, -1, cookie.MaxAge)

	svc.AssertExpectations(t)
}

func TestLogoutHandler_MissingCookie(t *testing.T) {
	svc := new(mock.AuthService)
	h := handler.NewAuthHandler(svc)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", nil)

	h.Logout(w, r)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
