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

// WriteJSON writes a success response with the given status code and data
func WriteJSON(w http.ResponseWriter, statusCode int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(successResponse{
		Success: true,
		Data:    data,
	})
}

// WriteError writes an error response mapping errors to HTTP status codes
func WriteError(w http.ResponseWriter, err error) {
	w.Header().Set("Content-Type", "application/json")

	var status int
	var detail errorDetail

	switch {
	case errors.Is(err, ErrInvalidInput):
		status = http.StatusUnprocessableEntity
		detail.Code = "VALIDATION_ERROR"
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			detail.Message = valErr.Message
			detail.Field = valErr.Field
		}

	case errors.Is(err, ErrAlreadyExists):
		status = http.StatusConflict
		detail.Code = "CONFLICT"
		detail.Message = "resource already exists"

	case errors.Is(err, ErrInvalidCredentials):
		status = http.StatusUnauthorized
		detail.Code = "INVALID_CREDENTIALS"
		detail.Message = "invalid email or password"

	case errors.Is(err, ErrInvalidToken):
		status = http.StatusUnauthorized
		detail.Code = "INVALID_TOKEN"
		detail.Message = "invalid or expired token"

	case errors.Is(err, ErrMissingToken):
		status = http.StatusUnauthorized
		detail.Code = "MISSING_TOKEN"
		detail.Message = "missing authorization token"

	case errors.Is(err, ErrMalformedToken):
		status = http.StatusUnauthorized
		detail.Code = "MALFORMED_TOKEN"
		detail.Message = "malformed authorization token"

	case errors.Is(err, ErrUnauthorized):
		status = http.StatusUnauthorized
		detail.Code = "UNAUTHORIZED"
		detail.Message = "unauthorized"

	case errors.Is(err, ErrForbidden):
		status = http.StatusForbidden
		detail.Code = "FORBIDDEN"
		detail.Message = "insufficient permissions"

	case errors.Is(err, ErrNotFound):
		status = http.StatusNotFound
		detail.Code = "NOT_FOUND"
		detail.Message = "resource not found"

	default:
		status = http.StatusInternalServerError
		detail.Code = "INTERNAL_SERVER_ERROR"
		detail.Message = "an unexpected error occurred"
	}

	w.WriteHeader(status)
	json.NewEncoder(w).Encode(errorResponse{
		Success: false,
		Error:   detail,
	})
}
