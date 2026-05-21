package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
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
	ID         string `json:"id"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	Role       string `json:"role"`
	IsVerified bool   `json:"is_verified"`
	AvatarURL  string `json:"avatar_url,omitempty"`
	CreatedAt  string `json:"created_at"`
}

func toUserResponse(user repository.User) UserResponse {
	return UserResponse{
		ID:         uuid.UUID(user.ID.Bytes).String(),
		Name:       user.Name,
		Email:      user.Email,
		Role:       string(user.Role),
		IsVerified: user.IsVerified,
		AvatarURL:  user.AvatarUrl.String,
		CreatedAt:  user.CreatedAt.Time.Format(time.RFC3339),
	}
}

type UserOrderResponse struct {
	ID              string `json:"id"`
	Quantity        int32  `json:"quantity"`
	Status          string `json:"status"`
	QrCode          string `json:"qr_code"`
	CheckedIn       bool   `json:"checked_in"`
	CheckedInAt     string `json:"checked_in_at,omitempty"`
	CreatedAt       string `json:"created_at"`
	EventTitle      string `json:"event_title"`
	EventSlug       string `json:"event_slug"`
	EventStartsAt   string `json:"event_starts_at"`
	EventEndsAt     string `json:"event_ends_at"`
	EventLocation   string `json:"event_location,omitempty"`
	EventVenue      string `json:"event_venue,omitempty"`
	EventIsOnline   bool   `json:"event_is_online"`
	EventOnlineUrl  string `json:"event_online_url,omitempty"`
	EventBannerUrl  string `json:"event_banner_url,omitempty"`
	TicketTypeName  string `json:"ticket_type_name"`
	TicketTypePrice int64  `json:"ticket_type_price"`
}

func toTicketResponse(t repository.GetOrdersByUserRow) UserOrderResponse {
	return UserOrderResponse{
		ID:              uuid.UUID(t.ID.Bytes).String(),
		Quantity:        t.Quantity,
		Status:          string(t.Status),
		QrCode:          t.QrCode.String,
		CheckedIn:       t.CheckedIn,
		CheckedInAt:     t.CheckedInAt.Time.Format(time.RFC3339),
		CreatedAt:       t.CreatedAt.Time.Format(time.RFC3339),
		EventTitle:      t.EventTitle,
		EventSlug:       t.EventSlug,
		EventStartsAt:   t.EventStartsAt.Time.Format(time.RFC3339),
		EventEndsAt:     t.EventEndsAt.Time.Format(time.RFC3339),
		EventLocation:   t.EventLocation.String,
		EventVenue:      t.EventVenue.String,
		EventIsOnline:   t.EventIsOnline,
		EventOnlineUrl:  t.EventOnlineUrl.String,
		EventBannerUrl:  t.EventBannerUrl.String,
		TicketTypeName:  t.TicketTypeName,
		TicketTypePrice: t.TicketTypePrice,
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

// GetMyTickets godoc
// @Summary Get my tickets
// @Description Returns the authenticated user's tickets
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Success 200 {array} UserOrderResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /users/me/tickets [get]
func (h *UserHandler) GetMyTickets(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	tickets, err := h.user.GetMyOrders(r.Context(), userID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	// convert repository rows to response objects
	resp := make([]UserOrderResponse, 0, len(tickets))
	for _, t := range tickets {
		resp = append(resp, toTicketResponse(t))
	}

	response.WriteJSON(w, http.StatusOK, resp)
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
// @Success 204 "No Content"
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
	_, err := h.user.DeleteMe(r.Context(), userID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
