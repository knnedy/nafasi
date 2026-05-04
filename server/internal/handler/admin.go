package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
)

type AdminHandler struct {
	admin AdminServicer
}

func NewAdminHandler(admin AdminServicer) *AdminHandler {
	return &AdminHandler{admin: admin}
}

// pagination helpers
func getPagination(r *http.Request) (limit, offset int32) {
	limit = 20
	offset = 0

	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = int32(parsed)
		}
	}

	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = int32(parsed)
		}
	}

	return limit, offset
}

type UpdateOrganiserVerificationInput struct {
	IsVerified bool `json:"is_verified"`
}

type AdminEventResponse struct {
	ID            string  `json:"id"`
	OrganiserID   string  `json:"organiser_id"`
	Title         string  `json:"title"`
	Slug          string  `json:"slug"`
	Description   *string `json:"description,omitempty"`
	Location      *string `json:"location,omitempty"`
	Venue         *string `json:"venue,omitempty"`
	BannerUrl     *string `json:"banner_url,omitempty"`
	StartsAt      string  `json:"starts_at"`
	EndsAt        string  `json:"ends_at"`
	Status        string  `json:"status"`
	IsOnline      bool    `json:"is_online"`
	OnlineUrl     *string `json:"online_url,omitempty"`
	CreatedAt     string  `json:"created_at"`
	UpdatedAt     string  `json:"updated_at"`
	OrganiserName string  `json:"organiser_name"`
}

// Essential helper to prevent pointer aliasing bugs
func stringPtr(ns sql.NullString) *string {
	if !ns.Valid {
		return nil
	}
	s := ns.String
	return &s
}

func toAdminEventResponseFromAll(event repository.AdminGetAllEventsRow) AdminEventResponse {
	return AdminEventResponse{
		ID:            event.ID.String(),
		OrganiserID:   event.OrganiserID.String(),
		Title:         event.Title,
		Slug:          event.Slug,
		Description:   &event.Description.String,
		Location:      &event.Location.String,
		Venue:         &event.Venue.String,
		BannerUrl:     &event.BannerUrl.String,
		StartsAt:      event.StartsAt.Time.Format(time.RFC3339),
		EndsAt:        event.EndsAt.Time.Format(time.RFC3339),
		Status:        string(event.Status),
		IsOnline:      event.IsOnline,
		OnlineUrl:     &event.OnlineUrl.String,
		CreatedAt:     event.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:     event.UpdatedAt.Time.Format(time.RFC3339),
		OrganiserName: event.OrganiserName,
	}
}

func toAdminEventResponseFromStatus(event repository.AdminGetEventsByStatusRow) AdminEventResponse {
	return AdminEventResponse{
		ID:            event.ID.String(),
		OrganiserID:   event.OrganiserID.String(),
		Title:         event.Title,
		Slug:          event.Slug,
		Description:   &event.Description.String,
		Location:      &event.Location.String,
		Venue:         &event.Venue.String,
		BannerUrl:     &event.BannerUrl.String,
		StartsAt:      event.StartsAt.Time.Format(time.RFC3339),
		EndsAt:        event.EndsAt.Time.Format(time.RFC3339),
		Status:        string(event.Status),
		IsOnline:      event.IsOnline,
		OnlineUrl:     &event.OnlineUrl.String,
		CreatedAt:     event.CreatedAt.Time.Format(time.RFC3339),
		UpdatedAt:     event.UpdatedAt.Time.Format(time.RFC3339),
		OrganiserName: event.OrganiserName,
	}
}

// func toAdminGetAllEventsResponse(e repository.AdminGetAllEventsRow) AdminEventResponse
// func toAdminGetEventsByStatusRowResponse(e repository.AdminGetEventsByStatusRow) AdminEventResponse

type AdminOrderResponse struct {
	ID            string  `json:"id"`
	UserID        string  `json:"user_id"`
	EventID       string  `json:"event_id"`
	Quantity      int32   `json:"quantity"`
	Status        string  `json:"status"`
	PaymentMethod *string `json:"payment_method,omitempty"`
	PaymentRef    *string `json:"payment_ref,omitempty"`
	CheckedIn     bool    `json:"checked_in"`
	CreatedAt     string  `json:"created_at"`
}

type AdminOrderDetailResponse struct {
	AdminOrderResponse
	UserName   string `json:"user_name"`
	UserEmail  string `json:"user_email"`
	EventTitle string `json:"event_title"`
}

type AdminStatsResponse struct {
	TotalUsers      int64 `json:"total_users"`
	TotalOrganisers int64 `json:"total_organisers"`
	TotalAttendees  int64 `json:"total_attendees"`
	TotalEvents     int64 `json:"total_events"`
	PublishedEvents int64 `json:"published_events"`
	TotalOrders     int64 `json:"total_orders"`
	PaidOrders      int64 `json:"paid_orders"`
	TotalRevenue    int64 `json:"total_revenue"`
}

func toAdminOrderDetailResponse(order repository.AdminGetRecentOrdersWithDetailsRow) AdminOrderDetailResponse {
	r := AdminOrderDetailResponse{
		AdminOrderResponse: AdminOrderResponse{
			ID:        order.ID.String(),
			UserID:    order.UserID.String(),
			EventID:   order.EventID.String(),
			Quantity:  order.Quantity,
			Status:    string(order.Status),
			CheckedIn: order.CheckedIn,
			CreatedAt: order.CreatedAt.Time.Format(time.RFC3339),
		},
		UserName:   order.UserName,
		UserEmail:  order.UserEmail,
		EventTitle: order.EventTitle,
	}

	if order.PaymentMethod.Valid {
		pm := string(order.PaymentMethod.PaymentMethod)
		r.PaymentMethod = &pm
	}

	if order.PaymentRef.Valid {
		r.PaymentRef = &order.PaymentRef.String
	}

	return r
}

// user management

// GetUsers godoc
// @Summary Get users
// @Description Returns paginated list of users with optional filters (admin only)
// @Tags Admin
// @Produce json
// @Security BearerAuth
// @Param role query string false "Role (ATTENDEE, ORGANISER, ADMIN)"
// @Param status query string false "Status (ACTIVE, BANNED, DELETED)"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {array} UserResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/users [get]
func (h *AdminHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	role := r.URL.Query().Get("role")
	status := r.URL.Query().Get("status")

	limit, offset := getPagination(r)

	var (
		users []repository.User
		err   error
	)

	switch {
	case role != "" && status != "":
		users, err = h.admin.AdminGetUsersByRoleAndStatus(
			r.Context(),
			repository.UserRole(role),
			repository.UserStatus(status),
			limit,
			offset,
		)

	case role != "":
		users, err = h.admin.AdminGetUsersByRole(
			r.Context(),
			repository.UserRole(role),
			limit,
			offset,
		)

	case status != "":
		users, err = h.admin.AdminGetUsersByStatus(
			r.Context(),
			repository.UserStatus(status),
			limit,
			offset,
		)

	default:
		users, err = h.admin.AdminGetAllUsers(r.Context(), limit, offset)
	}

	if err != nil {
		response.WriteError(w, err)
		return
	}

	var result []UserResponse
	for _, u := range users {
		result = append(result, toUserResponse(u))
	}

	response.WriteJSON(w, http.StatusOK, result)
}

// GetUserByID godoc
// @Summary Get user by ID
// @Description Returns a single user by ID (admin only)
// @Tags Admin
// @Produce json
// @Security BearerAuth
// @Param userID path string true "User ID"
// @Success 200 {object} UserResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/users/{userID} [get]
func (h *AdminHandler) GetUserByID(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	if userID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	user, err := h.admin.AdminGetUserByID(r.Context(), userID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, toUserResponse(user))
}

// GetOrganisers godoc
// @Summary Get organisers
// @Description Returns organisers filtered by approval status (admin only)
// @Tags Admin
// @Produce json
// @Security BearerAuth
// @Param status query string false "Status (pending, approved)"
// @Success 200 {array} UserResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/organisers [get]
func (h *AdminHandler) GetOrganisers(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	limit, offset := getPagination(r)

	var (
		organisers []repository.User
		err        error
	)

	switch status {
	case "pending":
		organisers, err = h.admin.AdminGetPendingOrganisers(r.Context(), limit, offset)

	case "approved":
		organisers, err = h.admin.AdminGetApprovedOrganisers(r.Context(), limit, offset)

	case "", "all":
		organisers, err = h.admin.AdminGetAllOrganisers(r.Context(), limit, offset)

	default:
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	if err != nil {
		response.WriteError(w, err)
		return
	}

	var result []UserResponse
	for _, o := range organisers {
		result = append(result, toUserResponse(o))
	}

	response.WriteJSON(w, http.StatusOK, result)
}

// UpdateOrganiserVerification godoc
// @Summary Update organiser verification status
// @Description Approves or rejects an organiser account (admin only)
// @Tags Admin
// @Produce json
// @Security BearerAuth
// @Param userID path string true "User ID"
// @Param body body UpdateOrganiserVerificationInput true "Verification payload"
// @Success 200 {object} UserResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 422 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/users/{userID}/verification [patch]
func (h *AdminHandler) UpdateOrganiserVerification(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	if userID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	var input UpdateOrganiserVerificationInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	user, err := h.admin.AdminUpdateUserVerification(r.Context(), userID, input.IsVerified)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, toUserResponse(user))
}

// BanUser godoc
// @Summary Ban user
// @Description Bans a user account (admin only)
// @Tags Admin
// @Produce json
// @Security BearerAuth
// @Param userID path string true "User ID"
// @Success 200 {object} UserResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/users/{userID}/ban [patch]
func (h *AdminHandler) BanUser(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	if userID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	user, err := h.admin.AdminBanUser(r.Context(), userID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, toUserResponse(user))
}

// UnbanUser godoc
// @Summary Unban user
// @Description Unbans a user account (admin only)
// @Tags Admin
// @Produce json
// @Security BearerAuth
// @Param userID path string true "User ID"
// @Success 200 {object} UserResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/users/{userID}/unban [patch]
func (h *AdminHandler) UnbanUser(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	if userID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	user, err := h.admin.AdminUnbanUser(r.Context(), userID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, toUserResponse(user))
}

// PromoteToAdmin godoc
// @Summary Promote user to admin
// @Description Promotes a user to admin role (admin only)
// @Tags Admin
// @Produce json
// @Security BearerAuth
// @Param userID path string true "User ID"
// @Success 200 {object} UserResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/users/{userID}/promote [patch]
func (h *AdminHandler) PromoteToAdmin(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	if userID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	user, err := h.admin.AdminSetUserRoleToAdmin(r.Context(), userID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, toUserResponse(user))
}

// DeleteUser godoc
// @Summary Delete user
// @Description Permanently deletes a user account (admin only)
// @Tags Admin
// @Produce json
// @Security BearerAuth
// @Param userID path string true "User ID"
// @Success 204 "No Content"
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/users/{userID} [delete]
func (h *AdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	if userID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	_, err := h.admin.AdminDeleteUser(r.Context(), userID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// event management

// GetEvents godoc
// @Summary Get events
// @Description Returns paginated list of events (admin only). Optional status filter.
// @Tags Admin
// @Produce json
// @Security BearerAuth
// @Param status query string false "Status (DRAFT, PUBLISHED, CANCELLED, COMPLETED)"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {array} AdminEventResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/events [get]
func (h *AdminHandler) GetEvents(w http.ResponseWriter, r *http.Request) {
	limit, offset := getPagination(r)
	status := r.URL.Query().Get("status")

	var result []AdminEventResponse

	if status != "" {
		events, err := h.admin.AdminGetEventsByStatus(r.Context(), repository.EventStatus(status), limit, offset)
		if err != nil {
			response.WriteError(w, err)
			return
		}
		for _, event := range events {
			// Map event to AdminEventResponse
			result = append(result, toAdminEventResponseFromStatus(event))
		}
	} else {
		events, err := h.admin.AdminGetAllEvents(r.Context(), limit, offset)
		if err != nil {
			response.WriteError(w, err)
			return
		}
		for _, event := range events {
			result = append(result, toAdminEventResponseFromAll(event))
		}
	}

	response.WriteJSON(w, http.StatusOK, result)
}

// CancelEvent godoc
// @Summary Cancel event
// @Description Cancels any event (admin only)
// @Tags Admin
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Success 200 {object} EventResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/events/{eventID}/cancel [patch]
func (h *AdminHandler) CancelEvent(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	event, err := h.admin.AdminCancelEvent(r.Context(), eventID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, toEventResponse(event))
}

// DeleteEvent godoc
// @Summary Delete event
// @Description Permanently deletes any event (admin only)
// @Tags Admin
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Success 204 "No Content"
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/events/{eventID} [delete]
func (h *AdminHandler) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	_, err := h.admin.AdminDeleteEvent(r.Context(), eventID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// order management

// GetOrdersByStatus godoc
// @Summary Get orders by status
// @Description Returns paginated list of orders filtered by status (admin only)
// @Tags Admin
// @Produce json
// @Security BearerAuth
// @Param status query string true "Status (PENDING, PAID, FAILED, CANCELLED, REFUNDED)"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {array} AdminOrderResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/orders [get]
func (h *AdminHandler) GetOrdersByStatus(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	if status == "" {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	limit, offset := getPagination(r)

	orders, err := h.admin.AdminGetOrdersByStatus(r.Context(), repository.OrderStatus(status), limit, offset)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	var result []AdminOrderResponse
	for _, o := range orders {
		resp := AdminOrderResponse{
			ID:        o.ID.String(),
			UserID:    o.UserID.String(),
			EventID:   o.EventID.String(),
			Quantity:  o.Quantity,
			Status:    string(o.Status),
			CheckedIn: o.CheckedIn,
			CreatedAt: o.CreatedAt.Time.Format(time.RFC3339),
		}
		if o.PaymentMethod.Valid {
			pm := string(o.PaymentMethod.PaymentMethod)
			resp.PaymentMethod = &pm
		}
		if o.PaymentRef.Valid {
			resp.PaymentRef = &o.PaymentRef.String
		}
		result = append(result, resp)
	}

	response.WriteJSON(w, http.StatusOK, result)
}

// GetRecentOrdersWithDetails godoc
// @Summary Get recent orders with details
// @Description Returns recent orders with user and event details (admin only)
// @Tags Admin
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit"
// @Success 200 {array} AdminOrderDetailResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/orders/recent [get]
func (h *AdminHandler) GetRecentOrdersWithDetails(w http.ResponseWriter, r *http.Request) {
	limit, _ := getPagination(r)

	orders, err := h.admin.AdminGetRecentOrdersWithDetails(r.Context(), limit)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	var result []AdminOrderDetailResponse
	for _, o := range orders {
		result = append(result, toAdminOrderDetailResponse(o))
	}

	response.WriteJSON(w, http.StatusOK, result)
}

// GetPlatformStats godoc
// @Summary Get platform stats
// @Description Returns platform-wide statistics (admin only)
// @Tags Admin
// @Produce json
// @Security BearerAuth
// @Success 200 {object} AdminStatsResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/stats [get]
func (h *AdminHandler) GetPlatformStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.admin.AdminGetPlatformStats(r.Context())
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, AdminStatsResponse{
		TotalUsers:      stats.TotalUsers,
		TotalOrganisers: stats.TotalOrganisers,
		TotalAttendees:  stats.TotalAttendees,
		TotalEvents:     stats.TotalEvents,
		PublishedEvents: stats.PublishedEvents,
		TotalOrders:     stats.TotalOrders,
		PaidOrders:      stats.PaidOrders,
		TotalRevenue:    stats.TotalRevenue,
	})
}
