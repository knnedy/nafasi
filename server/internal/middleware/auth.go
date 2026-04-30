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
	contextKeyRole   contextKey = "user_role"
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

// RequireRole blocks requests where the authenticated user does not have the required role
func (am *AuthMiddleware) RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userRole, ok := r.Context().Value(contextKeyRole).(string)
			if !ok || userRole != role {
				response.WriteError(w, response.ErrForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// GetUserID retrieves the authenticated user ID from the context
func GetUserID(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(contextKeyUserID).(string)
	return userID, ok
}

// GetUserRole retrieves the authenticated user role from context
func GetUserRole(ctx context.Context) (string, bool) {
	role, ok := ctx.Value(contextKeyRole).(string)
	return role, ok
}

func SetUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, contextKeyUserID, userID)
}

func SetUserRole(ctx context.Context, role string) context.Context {
	return context.WithValue(ctx, contextKeyRole, role)
}
