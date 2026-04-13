package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/token"
)

// contextKey is an unexported type for context keys in this package
// prevents collisions with other packages
type contextKey string

const (
	contextKeyUserID contextKey = "userID"
)

type AuthMiddleware struct {
	tokens *token.TokenManager
}

func NewAuthMiddleware(tokens *token.TokenManager) *AuthMiddleware {
	return &AuthMiddleware{tokens: tokens}
}

// Authenticate validates the JWT access token attaches the userID to the context
func (am *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// extract token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			response.WriteError(w, response.ErrMissingToken)
			return
		}

		// header must be in the format: Bearer <token>
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			response.WriteError(w, response.ErrMalformedToken)
			return
		}

		//validate access token
		claims, err := am.tokens.ValidateAccessToken(parts[1])
		if err != nil {
			response.WriteError(w, response.ErrInvalidToken)
			return
		}

		// attach userID to context and call handler
		ctx := context.WithValue(r.Context(), contextKeyUserID, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserID retrieves the authenticated user ID from the context
func GetUserID(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(contextKeyUserID).(string)
	return userID, ok
}
