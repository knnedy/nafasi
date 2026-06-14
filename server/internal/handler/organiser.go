package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/knnedy/nafasi/internal/middleware"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
)

type OrganiserHandler struct {
	organiser OrganiserServicer
}

func NewOrganiserHandler(organiser OrganiserServicer) *OrganiserHandler {
	return &OrganiserHandler{organiser: organiser}
}

// response types
type TicketTypeSalesResponse struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Price        int64  `json:"price"`
	Quantity     int32  `json:"quantity"`
	QuantitySold int32  `json:"quantity_sold"`
	Revenue      int32  `json:"revenue"`
}

type OrderStatusBreakdownResponse struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}

type OrganiserOrderResponse struct {
	ID            string  `json:"id"`
	UserID        string  `json:"user_id"`
	EventID       string  `json:"event_id"`
	TicketTypeID  string  `json:"ticket_type_id"`
	Quantity      int32   `json:"quantity"`
	Status        string  `json:"status"`
	PaymentMethod *string `json:"payment_method,omitempty"`
	PaymentRef    *string `json:"payment_ref,omitempty"`
	CheckedIn     bool    `json:"checked_in"`
	CheckedInAt   *string `json:"checked_in_at,omitempty"`
	CreatedAt     string  `json:"created_at"`
}

func toOrganiserOrderResponse(order repository.Order) OrganiserOrderResponse {
	r := OrganiserOrderResponse{
		ID:           order.ID.String(),
		UserID:       order.UserID.String(),
		EventID:      order.EventID.String(),
		TicketTypeID: order.TicketTypeID.String(),
		Quantity:     order.Quantity,
		Status:       string(order.Status),
		CheckedIn:    order.CheckedIn,
		CreatedAt:    order.CreatedAt.Time.Format(time.RFC3339),
	}

	if order.PaymentMethod.Valid {
		pm := string(order.PaymentMethod.PaymentMethod)
		r.PaymentMethod = &pm
	}

	if order.PaymentRef.Valid {
		r.PaymentRef = &order.PaymentRef.String
	}

	if order.CheckedInAt.Valid {
		t := order.CheckedInAt.Time.Format(time.RFC3339)
		r.CheckedInAt = &t
	}

	return r
}

func toTicketTypeSalesResponse(row repository.GetTicketTypeSalesByEventRow) TicketTypeSalesResponse {
	return TicketTypeSalesResponse{
		ID:           row.ID.String(),
		Name:         row.Name,
		Price:        row.Price,
		Quantity:     row.Quantity,
		QuantitySold: row.QuantitySold,
		Revenue:      row.Revenue,
	}
}

func toOrderStatusBreakdownResponse(row repository.GetEventOrderStatusBreakdownRow) OrderStatusBreakdownResponse {
	return OrderStatusBreakdownResponse{
		Status: string(row.Status),
		Count:  row.Count,
	}
}

// GetEventsByOrganiser godoc
// @Summary Get organiser events
// @Description Returns all events created by the authenticated organiser
// @Tags Organiser
// @Produce json
// @Security BearerAuth
// @Success 200 {array} EventResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /organiser/events [get]
func (h *OrganiserHandler) GetEventsByOrganiser(w http.ResponseWriter, r *http.Request) {
	organiserID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	events, err := h.organiser.GetEventsByOrganiser(r.Context(), organiserID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	var result []EventResponse
	for _, e := range events {
		result = append(result, toEventResponse(e))
	}

	response.WriteJSON(w, http.StatusOK, result)
}

// GetOrdersByOrganiser godoc
// @Summary Get organiser orders
// @Description Returns paginated orders for all events created by the authenticated organiser.
// @Tags Organiser
// @Produce json
// @Security BearerAuth
// @Param status query string false "Filter by status (PENDING, PAID, FAILED, CANCELLED, REFUNDED)"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {array} OrganiserOrderResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /organiser/orders [get]
func (h *OrganiserHandler) GetOrdersByOrganiser(w http.ResponseWriter, r *http.Request) {
	organiserID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	limit, offset := getPagination(r)
	status := r.URL.Query().Get("status")

	orders, err := h.organiser.GetOrdersByOrganiser(r.Context(), organiserID, repository.OrderStatus(status), limit, offset)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	var result []OrganiserOrderResponse
	for _, o := range orders {
		result = append(result, toOrganiserOrderResponse(o))
	}

	response.WriteJSON(w, http.StatusOK, result)
}

// GetTicketTypesByEvent godoc
// @Summary Get ticket types for an event
// @Description Returns all ticket types for a specific event (organiser only)
// @Tags Organiser
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Success 200 {array} TicketTypeResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /organiser/events/{eventID}/ticket-types [get]
func (h *OrganiserHandler) GetTicketTypesByEvent(w http.ResponseWriter, r *http.Request) {
	organiserID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	ticketTypes, err := h.organiser.GetTicketTypesByEvent(r.Context(), organiserID, eventID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	var result []TicketTypeResponse
	for _, tt := range ticketTypes {
		result = append(result, toTicketTypeResponse(tt))
	}

	response.WriteJSON(w, http.StatusOK, result)
}

// GetTicketTypeSalesByEvent godoc
// @Summary Get ticket type sales breakdown
// @Description Returns sales breakdown per ticket type for an event (organiser only)
// @Tags Organiser
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Success 200 {array} TicketTypeSalesResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /organiser/events/{eventID}/ticket-types/sales [get]
func (h *OrganiserHandler) GetTicketTypeSalesByEvent(w http.ResponseWriter, r *http.Request) {
	organiserID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	sales, err := h.organiser.GetTicketTypeSalesByEvent(r.Context(), organiserID, eventID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	var result []TicketTypeSalesResponse
	for _, s := range sales {
		result = append(result, toTicketTypeSalesResponse(s))
	}

	response.WriteJSON(w, http.StatusOK, result)
}

// GetTotalTicketsSold godoc
// @Summary Get total tickets sold
// @Description Returns total tickets sold for an event (organiser only)
// @Tags Organiser
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Success 200 {object} map[string]int64
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /organiser/events/{eventID}/tickets-sold [get]
func (h *OrganiserHandler) GetTotalTicketsSold(w http.ResponseWriter, r *http.Request) {
	organiserID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	total, err := h.organiser.GetTotalTicketsSold(r.Context(), organiserID, eventID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]int64{
		"total_tickets_sold": total,
	})
}

// GetOrdersByEvent godoc
// @Summary Get orders for an event
// @Description Returns paginated orders for a specific event. Can optionally filter by status (organiser only)
// @Tags Organiser
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Param status query string false "Filter by status (PENDING, PAID, FAILED, CANCELLED, REFUNDED)"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {array} OrganiserOrderResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /organiser/events/{eventID}/orders [get]
func (h *OrganiserHandler) GetOrdersByEvent(w http.ResponseWriter, r *http.Request) {
	organiserID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	status := r.URL.Query().Get("status")
	limit, offset := getPagination(r)

	var orders []repository.Order
	var err error

	if status != "" {
		orders, err = h.organiser.GetOrdersByEventAndStatus(
			r.Context(),
			organiserID,
			eventID,
			repository.OrderStatus(status),
			limit,
			offset,
		)
	} else {
		orders, err = h.organiser.GetOrdersByEvent(
			r.Context(),
			organiserID,
			eventID,
			limit,
			offset,
		)
	}

	if err != nil {
		response.WriteError(w, err)
		return
	}

	var result []OrganiserOrderResponse
	for _, o := range orders {
		result = append(result, toOrganiserOrderResponse(o))
	}

	response.WriteJSON(w, http.StatusOK, result)
}

// GetRecentEventOrders godoc
// @Summary Get recent orders for an event
// @Description Returns the most recent orders for an event (organiser only)
// @Tags Organiser
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Param limit query int false "Limit"
// @Success 200 {array} OrganiserOrderResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /organiser/events/{eventID}/orders/recent [get]
func (h *OrganiserHandler) GetRecentEventOrders(w http.ResponseWriter, r *http.Request) {
	organiserID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	limit, _ := getPagination(r)

	orders, err := h.organiser.GetRecentEventOrders(r.Context(), organiserID, eventID, limit)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	var result []OrganiserOrderResponse
	for _, o := range orders {
		result = append(result, toOrganiserOrderResponse(o))
	}

	response.WriteJSON(w, http.StatusOK, result)
}

// GetEventRevenue godoc
// @Summary Get event revenue
// @Description Returns total revenue for an event (organiser only)
// @Tags Organiser
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Success 200 {object} map[string]int64
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /organiser/events/{eventID}/revenue [get]
func (h *OrganiserHandler) GetEventRevenue(w http.ResponseWriter, r *http.Request) {
	organiserID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	revenue, err := h.organiser.GetEventRevenue(r.Context(), organiserID, eventID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]int64{
		"revenue": revenue,
	})
}

// GetEventOrdersCount godoc
// @Summary Get event orders count
// @Description Returns total number of orders for an event (organiser only)
// @Tags Organiser
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Success 200 {object} map[string]int64
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /organiser/events/{eventID}/orders/count [get]
func (h *OrganiserHandler) GetEventOrdersCount(w http.ResponseWriter, r *http.Request) {
	organiserID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	count, err := h.organiser.GetEventOrdersCount(r.Context(), organiserID, eventID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]int64{
		"total_orders": count,
	})
}

// GetEventCheckedInCount godoc
// @Summary Get event checked in count
// @Description Returns total number of checked in attendees for an event (organiser only)
// @Tags Organiser
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Success 200 {object} map[string]int64
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /organiser/events/{eventID}/checkin/count [get]
func (h *OrganiserHandler) GetEventCheckedInCount(w http.ResponseWriter, r *http.Request) {
	organiserID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	count, err := h.organiser.GetEventCheckedInCount(r.Context(), organiserID, eventID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]int64{
		"checked_in_count": count,
	})
}

// GetEventOrderStatusBreakdown godoc
// @Summary Get event order status breakdown
// @Description Returns order count grouped by status for an event (organiser only)
// @Tags Organiser
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Success 200 {array} OrderStatusBreakdownResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /organiser/events/{eventID}/orders/breakdown [get]
func (h *OrganiserHandler) GetEventOrderStatusBreakdown(w http.ResponseWriter, r *http.Request) {
	organiserID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	breakdown, err := h.organiser.GetEventOrderStatusBreakdown(r.Context(), organiserID, eventID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	var result []OrderStatusBreakdownResponse
	for _, b := range breakdown {
		result = append(result, toOrderStatusBreakdownResponse(b))
	}

	response.WriteJSON(w, http.StatusOK, result)
}

// GetEventTicketsSold godoc
// @Summary Get event tickets sold
// @Description Returns total tickets sold from paid orders for an event (organiser only)
// @Tags Organiser
// @Produce json
// @Security BearerAuth
// @Param eventID path string true "Event ID"
// @Success 200 {object} map[string]int64
// @Failure 401 {object} response.ErrorResponse
// @Failure 403 {object} response.ErrorResponse
// @Failure 404 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /organiser/events/{eventID}/tickets-sold/paid [get]
func (h *OrganiserHandler) GetEventTicketsSold(w http.ResponseWriter, r *http.Request) {
	organiserID, ok := middleware.GetUserID(r.Context())
	if !ok {
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	eventID := chi.URLParam(r, "eventID")
	if eventID == "" {
		response.WriteError(w, response.ErrNotFound)
		return
	}

	sold, err := h.organiser.GetEventTicketsSold(r.Context(), organiserID, eventID)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]int64{
		"tickets_sold": sold,
	})
}
