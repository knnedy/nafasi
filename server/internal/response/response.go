package response

import (
	"encoding/json"
	"errors"
	"net/http"
)

type successResponse struct {
	Success bool `json:"success"`
	Data    any  `json:"data"`
}

type errorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Field   string `json:"field,omitempty"`
}

type errorResponse struct {
	Success bool        `json:"success"`
	Error   errorDetail `json:"error"`
}

func WriteJSON(w http.ResponseWriter, statusCode int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	_ = json.NewEncoder(w).Encode(successResponse{
		Success: true,
		Data:    data,
	})
}

func WriteError(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")

	var status int
	var detail errorDetail

	switch {
	// Validation
	case errors.Is(err, ErrInvalidInput):
		status = http.StatusUnprocessableEntity
		detail.Code = "VALIDATION_ERROR"

		var valErr *ValidationError
		if errors.As(err, &valErr) {
			detail.Message = valErr.Message
			detail.Field = valErr.Field
		} else {
			detail.Message = "validation error"
		}

	// Auth
	case errors.Is(err, ErrEmailAlreadyExists):
		status = http.StatusConflict
		detail.Code = "EMAIL_ALREADY_EXISTS"
		detail.Message = "an account with this email already exists"

	case errors.Is(err, ErrInvalidCredentials):
		status = http.StatusUnauthorized
		detail.Code = "INVALID_CREDENTIALS"
		detail.Message = "invalid email or password"

	case errors.Is(err, ErrUnauthorized):
		status = http.StatusUnauthorized
		detail.Code = "UNAUTHORIZED"
		detail.Message = "unauthorized"

	// Token
	case errors.Is(err, ErrMissingToken):
		status = http.StatusUnauthorized
		detail.Code = "MISSING_TOKEN"
		detail.Message = "missing authorization token"

	case errors.Is(err, ErrMalformedToken):
		status = http.StatusUnauthorized
		detail.Code = "MALFORMED_TOKEN"
		detail.Message = "malformed authorization token"

	case errors.Is(err, ErrInvalidToken):
		status = http.StatusUnauthorized
		detail.Code = "INVALID_TOKEN"
		detail.Message = "invalid or expired token"

	// Permissions
	case errors.Is(err, ErrForbidden):
		status = http.StatusForbidden
		detail.Code = "FORBIDDEN"
		detail.Message = "insufficient permissions"

	// Not found
	case errors.Is(err, ErrNotFound):
		status = http.StatusNotFound
		detail.Code = "NOT_FOUND"

		var nfErr *NotFoundError
		if errors.As(err, &nfErr) {
			detail.Message = nfErr.Error()
		} else {
			detail.Message = "resource not found"
		}

	// Conflict
	case errors.Is(err, ErrAlreadyExists):
		status = http.StatusConflict
		detail.Code = "CONFLICT"
		detail.Message = "resource already exists"

	// Payment
	case errors.Is(err, ErrPaymentFailed):
		status = http.StatusBadGateway
		detail.Code = "PAYMENT_FAILED"

		var payErr *PaymentError
		if errors.As(err, &payErr) {
			detail.Message = payErr.Message
		} else {
			detail.Message = "payment initiation failed"
		}

	case errors.Is(err, ErrInsufficientTickets):
		status = http.StatusConflict
		detail.Code = "INSUFFICIENT_TICKETS"
		detail.Message = "insufficient tickets available"

	case errors.Is(err, ErrTicketAlreadyCheckedIn):
		status = http.StatusConflict
		detail.Code = "TICKET_ALREADY_CHECKED_IN"
		detail.Message = "ticket has already been checked in"

	case errors.Is(err, ErrInvalidPaymentMethod):
		status = http.StatusUnprocessableEntity
		detail.Code = "INVALID_PAYMENT_METHOD"
		detail.Message = "invalid payment method"

	case errors.Is(err, ErrOrderAlreadyPaid):
		status = http.StatusConflict
		detail.Code = "ORDER_ALREADY_PAID"
		detail.Message = "order has already been paid"

	case errors.Is(err, ErrOrderNotPaid):
		status = http.StatusConflict
		detail.Code = "ORDER_NOT_PAID"
		detail.Message = "order has not been paid"

	case errors.Is(err, ErrOrderCancelled):
		status = http.StatusConflict
		detail.Code = "ORDER_CANCELLED"
		detail.Message = "order has been cancelled"

	// Event
	case errors.Is(err, ErrEventNotPublished):
		status = http.StatusForbidden
		detail.Code = "EVENT_NOT_PUBLISHED"
		detail.Message = "event is not published"

	case errors.Is(err, ErrEventCancelled):
		status = http.StatusConflict
		detail.Code = "EVENT_CANCELLED"
		detail.Message = "event has been cancelled"

	case errors.Is(err, ErrEventCompleted):
		status = http.StatusConflict
		detail.Code = "EVENT_COMPLETED"
		detail.Message = "event has already completed"

	case errors.Is(err, ErrSaleNotStarted):
		status = http.StatusForbidden
		detail.Code = "SALE_NOT_STARTED"
		detail.Message = "ticket sales have not started yet"

	case errors.Is(err, ErrSaleEnded):
		status = http.StatusConflict
		detail.Code = "SALE_ENDED"
		detail.Message = "ticket sales have ended"

	// Database
	case errors.Is(err, ErrDatabase):
		status = http.StatusInternalServerError
		detail.Code = "DATABASE_ERROR"
		detail.Message = "a database error occurred"

	// Internal
	case errors.Is(err, ErrInternal):
		status = http.StatusInternalServerError
		detail.Code = "INTERNAL_ERROR"
		detail.Message = "an internal server error occurred"

	// Fallback
	default:
		status = http.StatusInternalServerError
		detail.Code = "INTERNAL_SERVER_ERROR"
		detail.Message = "an unexpected error occurred"
	}

	w.WriteHeader(status)

	_ = json.NewEncoder(w).Encode(errorResponse{
		Success: false,
		Error:   detail,
	})
}
