package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/knnedy/nafasi/internal/middleware"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
)

type UserHandler struct {
	user UserServicer
}

func NewUserHandler(user UserServicer) *UserHandler {
	return &UserHandler{user: user}
}

// UserResponse is the public representation of a user
type UserResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func toUserResponse(user repository.User) UserResponse {
	return UserResponse{
		ID:        user.ID.String(),
		Name:      user.Name,
		Email:     user.Email,
		CreatedAt: user.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt: user.UpdatedAt.Time.Format(time.RFC3339),
	}
}

// GetMe godoc
// @Summary Get current user
// @Description Returns the authenticated user's profile
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Success 200 {object} UserResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /users/me [get]
func (h *UserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	// get authenticated user ID from context
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	// get user
	user, err := h.user.GetMe(r.Context(), userID)
	if err != nil {
		response.WriteError(w, err)
		return
	}
	response.WriteJSON(w, http.StatusOK, toUserResponse(user))
}

// UpdateMe godoc
// @Summary Update user profile
// @Description Updates the authenticated user's profile details
// @Tags Users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body service.UpdateProfileInput true "Update profile payload"
// @Success 200 {object} UserResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /users/me [patch]
func (h *UserHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	// get authenticated user ID from context
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	// decode request body
	var input service.UpdateProfileInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	// update user profile
	user, err := h.user.UpdateProfile(r.Context(), userID, input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, toUserResponse(user))
}

// UpdateAvatar godoc
// @Summary Update user avatar
// @Description Updates the authenticated user's avatar
// @Tags Users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body service.UpdateAvatarInput true "Update avatar payload"
// @Success 200 {object} UserResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /users/me/avatar [patch]
func (h *UserHandler) UpdateAvatar(w http.ResponseWriter, r *http.Request) {
	// get authenticated user ID from context
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	// decode request body
	var input service.UpdateAvatarInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	// update user avatar
	user, err := h.user.UpdateAvatar(r.Context(), userID, input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, toUserResponse(user))
}

// UpdatePassword godoc
// @Summary Update user password
// @Description Updates the authenticated user's password
// @Tags Users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body service.UpdatePasswordInput true "Update password payload"
// @Success 200 {object} map[string]string
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /users/me/password [patch]
func (h *UserHandler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	// get authenticated user ID from context
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	// decode request body
	var input service.UpdatePasswordInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	// update password
	if err := h.user.UpdatePassword(r.Context(), userID, input); err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, nil)
}

// DeleteMe godoc
// @Summary Delete user account
// @Description Deletes the authenticated user's account
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]string
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /users/me [delete]

func (h *UserHandler) DeleteMe(w http.ResponseWriter, r *http.Request) {
	// get authenticated user ID from context
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	// delete user
	if err := h.user.DeleteMe(r.Context(), userID); err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, nil)
}
