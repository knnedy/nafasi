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
	handlermock "github.com/knnedy/nafasi/internal/handler/mock"
	"github.com/knnedy/nafasi/internal/middleware"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/assert"
	mocktestify "github.com/stretchr/testify/mock"
)

func makeUser() repository.User {
	return repository.User{
		ID:    pgtype.UUID{Bytes: uuid.New(), Valid: true},
		Name:  "John Doe",
		Email: "john@example.com",
		Role:  repository.UserRoleATTENDEE,
	}
}

func withUserID(r *http.Request, userID string) *http.Request {
	ctx := middleware.SetUserID(r.Context(), userID)
	return r.WithContext(ctx)
}

// GetMe
func TestGetMeHandler_Success(t *testing.T) {
	svc := new(handlermock.UserService)
	h := handler.NewUserHandler(svc)

	userID := uuid.New().String()
	user := makeUser()

	svc.On("GetMe", mocktestify.Anything, userID).
		Return(user, nil)

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodGet, "/api/v1/users/me", nil), userID)

	h.GetMe(w, r)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]any
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.True(t, resp["success"].(bool))

	svc.AssertExpectations(t)
}

func TestGetMeHandler_NotFound(t *testing.T) {
	svc := new(handlermock.UserService)
	h := handler.NewUserHandler(svc)

	userID := uuid.New().String()

	svc.On("GetMe", mocktestify.Anything, userID).
		Return(repository.User{}, response.ErrNotFound)

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodGet, "/api/v1/users/me", nil), userID)

	h.GetMe(w, r)

	assert.Equal(t, http.StatusNotFound, w.Code)
	svc.AssertExpectations(t)
}

// UpdateProfile
func TestUpdateProfileHandler_Success(t *testing.T) {
	svc := new(handlermock.UserService)
	h := handler.NewUserHandler(svc)

	userID := uuid.New().String()
	input := service.UpdateProfileInput{
		Name:  "John Updated",
		Email: "john@example.com",
	}

	svc.On("UpdateProfile", mocktestify.Anything, userID, input).
		Return(repository.User{
			Name:  "John Updated",
			Email: "john@example.com",
		}, nil)

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodPatch, "/api/v1/users/me", toJSON(t, input)), userID)
	r.Header.Set("Content-Type", "application/json")

	h.UpdateMe(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestUpdateProfileHandler_InvalidBody(t *testing.T) {
	svc := new(handlermock.UserService)
	h := handler.NewUserHandler(svc)

	userID := uuid.New().String()

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodPatch, "/api/v1/users/me", bytes.NewBufferString("not json")), userID)
	r.Header.Set("Content-Type", "application/json")

	h.UpdateMe(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

func TestUpdateProfileHandler_EmailTaken(t *testing.T) {
	svc := new(handlermock.UserService)
	h := handler.NewUserHandler(svc)

	userID := uuid.New().String()
	input := service.UpdateProfileInput{
		Name:  "John Doe",
		Email: "taken@example.com",
	}

	svc.On("UpdateProfile", mocktestify.Anything, userID, input).
		Return(repository.User{}, response.ErrAlreadyExists)

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodPatch, "/api/v1/users/me", toJSON(t, input)), userID)
	r.Header.Set("Content-Type", "application/json")

	h.UpdateMe(w, r)

	assert.Equal(t, http.StatusConflict, w.Code)
	svc.AssertExpectations(t)
}

// UpdatePassword
func TestUpdatePasswordHandler_Success(t *testing.T) {
	svc := new(handlermock.UserService)
	h := handler.NewUserHandler(svc)

	userID := uuid.New().String()
	input := service.UpdatePasswordInput{
		CurrentPassword: "OldPassword1!",
		NewPassword:     "NewPassword1!",
	}

	svc.On("UpdatePassword", mocktestify.Anything, userID, input).
		Return(nil)

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodPatch, "/api/v1/users/me/password", toJSON(t, input)), userID)
	r.Header.Set("Content-Type", "application/json")

	h.UpdatePassword(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestUpdatePasswordHandler_WrongCurrentPassword(t *testing.T) {
	svc := new(handlermock.UserService)
	h := handler.NewUserHandler(svc)

	userID := uuid.New().String()
	input := service.UpdatePasswordInput{
		CurrentPassword: "WrongPassword1!",
		NewPassword:     "NewPassword1!",
	}

	svc.On("UpdatePassword", mocktestify.Anything, userID, input).
		Return(response.ErrInvalidCredentials)

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodPatch, "/api/v1/users/me/password", toJSON(t, input)), userID)
	r.Header.Set("Content-Type", "application/json")

	h.UpdatePassword(w, r)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	svc.AssertExpectations(t)
}

func TestUpdatePasswordHandler_InvalidBody(t *testing.T) {
	svc := new(handlermock.UserService)
	h := handler.NewUserHandler(svc)

	userID := uuid.New().String()

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodPatch, "/api/v1/users/me/password", bytes.NewBufferString("not json")), userID)
	r.Header.Set("Content-Type", "application/json")

	h.UpdatePassword(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

// UpdateAvatar
func TestUpdateAvatarHandler_Success(t *testing.T) {
	svc := new(handlermock.UserService)
	h := handler.NewUserHandler(svc)

	userID := uuid.New().String()
	input := service.UpdateAvatarInput{
		AvatarURL: "https://example.com/avatar.jpg",
	}

	svc.On("UpdateAvatar", mocktestify.Anything, userID, input).
		Return(makeUser(), nil)

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodPatch, "/api/v1/users/me/avatar", toJSON(t, input)), userID)
	r.Header.Set("Content-Type", "application/json")

	h.UpdateAvatar(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestUpdateAvatarHandler_InvalidBody(t *testing.T) {
	svc := new(handlermock.UserService)
	h := handler.NewUserHandler(svc)

	userID := uuid.New().String()

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodPatch, "/api/v1/users/me/avatar", bytes.NewBufferString("not json")), userID)
	r.Header.Set("Content-Type", "application/json")

	h.UpdateAvatar(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

// DeleteMe
func TestDeleteMeHandler_Success(t *testing.T) {
	svc := new(handlermock.UserService)
	h := handler.NewUserHandler(svc)

	userID := uuid.New().String()

	svc.On("DeleteMe", mocktestify.Anything, userID).
		Return(nil)

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodDelete, "/api/v1/users/me", nil), userID)

	h.DeleteMe(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestDeleteMeHandler_NotFound(t *testing.T) {
	svc := new(handlermock.UserService)
	h := handler.NewUserHandler(svc)

	userID := uuid.New().String()

	svc.On("DeleteMe", mocktestify.Anything, userID).
		Return(response.ErrNotFound)

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodDelete, "/api/v1/users/me", nil), userID)

	h.DeleteMe(w, r)

	assert.Equal(t, http.StatusNotFound, w.Code)
	svc.AssertExpectations(t)
}

func TestDeleteMeHandler_DatabaseError(t *testing.T) {
	svc := new(handlermock.UserService)
	h := handler.NewUserHandler(svc)

	userID := uuid.New().String()

	svc.On("DeleteMe", mocktestify.Anything, userID).
		Return(response.ErrDatabase)

	w := httptest.NewRecorder()
	r := withUserID(httptest.NewRequest(http.MethodDelete, "/api/v1/users/me", nil), userID)

	h.DeleteMe(w, r)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	svc.AssertExpectations(t)
}
