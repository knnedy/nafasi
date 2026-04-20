package response

import "errors"

var (
	// Resource not found
	ErrNotFound = errors.New("resource not found")

	// Input validation
	ErrInvalidInput = errors.New("validation error")

	// Auth
	ErrUnauthorized       = errors.New("unauthorized")
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")

	// Permissions
	ErrForbidden = errors.New("forbidden")

	// Conflict
	ErrAlreadyExists = errors.New("resource already exists")

	// Token errors
	ErrMissingToken   = errors.New("missing authorization token")
	ErrMalformedToken = errors.New("malformed authorization token")
	ErrInvalidToken   = errors.New("invalid or expired token")

	// Database
	ErrDatabase = errors.New("a database error occurred")

	// Internal server errors
	ErrInternal = errors.New("an internal server error occurred")

	// Payment errors
	ErrPaymentFailed          = errors.New("payment initiation failed")
	ErrInsufficientTickets    = errors.New("insufficient tickets available")
	ErrTicketAlreadyCheckedIn = errors.New("ticket has already been checked in")
	ErrInvalidPaymentMethod   = errors.New("invalid payment method")
	ErrOrderAlreadyPaid       = errors.New("order has already been paid")
	ErrOrderCancelled         = errors.New("order has been cancelled")

	// Event errors
	ErrEventNotPublished = errors.New("event is not published")
	ErrEventCancelled    = errors.New("event has been cancelled")
	ErrEventCompleted    = errors.New("event has already completed")
	ErrSaleNotStarted    = errors.New("ticket sales have not started yet")
	ErrSaleEnded         = errors.New("ticket sales have ended")
)

// ValidationError carries field-level detail on top of ErrInvalidInput
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return e.Field + ": " + e.Message
}

func (e *ValidationError) Unwrap() error {
	return ErrInvalidInput
}

// NotFoundError carries the resource type for richer error messages
type NotFoundError struct {
	Resource string
}

func (e *NotFoundError) Error() string {
	return e.Resource + " not found"
}

func (e *NotFoundError) Unwrap() error {
	return ErrNotFound
}

// PaymentError carries payment-specific detail
type PaymentError struct {
	Code    string
	Message string
}

func (e *PaymentError) Error() string {
	return e.Code + ": " + e.Message
}

func (e *PaymentError) Unwrap() error {
	return ErrPaymentFailed
}
