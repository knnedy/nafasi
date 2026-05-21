package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
)

const (
	// refreshTokenCookie is httpOnly and scoped to /api/v1/auth only.
	// The browser sends it exclusively to auth endpoints — never to the proxy.
	refreshTokenCookie = "_rt"

	// sidCookie is non-httpOnly and scoped to /.
	// It carries no sensitive value ("1") — it only signals to the proxy
	// that an active session exists so routing decisions can be made.
	sidCookie = "_sid"
)

type AuthHandler struct {
	auth AuthServicer
	env  string
}

func NewAuthHandler(auth AuthServicer, env string) *AuthHandler {
	return &AuthHandler{auth: auth, env: env}
}

func (h *AuthHandler) isProduction() bool {
	return h.env == "production"
}

// authDataResponse is the data envelope returned on login, register (attendee) and refresh
type authDataResponse struct {
	User        UserResponse `json:"user"`
	AccessToken string       `json:"access_token"`
}

// organiserPendingResponse is returned on organiser registration — no tokens issued
type organiserPendingResponse struct {
	User    UserResponse `json:"user"`
	Pending bool         `json:"pending"`
	Message string       `json:"message"`
}

func toAuthDataResponse(result service.AuthResult) authDataResponse {
	return authDataResponse{
		User:        toUserResponse(result.User),
		AccessToken: result.AccessToken,
	}
}

func toOrganiserPendingResponse(result service.AuthResult) organiserPendingResponse {
	return organiserPendingResponse{
		User:    toUserResponse(result.User),
		Pending: true,
		Message: "your account is pending admin approval",
	}
}

func (h *AuthHandler) setSessionCookies(w http.ResponseWriter, refreshToken string) {
	// _rt — the actual refresh token, httpOnly, scoped to auth endpoints only
	http.SetCookie(w, &http.Cookie{
		Name:     refreshTokenCookie,
		Value:    refreshToken,
		HttpOnly: true,
		Secure:   h.isProduction(),
		SameSite: http.SameSiteStrictMode,
		Path:     "/api/v1/auth",
		MaxAge:   7 * 24 * 60 * 60,
	})

	// _sid — non-sensitive session indicator, readable by the proxy for routing
	http.SetCookie(w, &http.Cookie{
		Name:     sidCookie,
		Value:    "1",
		HttpOnly: false,
		Secure:   h.isProduction(),
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
		MaxAge:   7 * 24 * 60 * 60,
	})
}

func (h *AuthHandler) clearSessionCookies(w http.ResponseWriter) {
	pastTime := time.Unix(0, 0) // Jan 1, 1970

	http.SetCookie(w, &http.Cookie{
		Name:     refreshTokenCookie,
		Value:    "",
		HttpOnly: true,
		Secure:   h.isProduction(),
		SameSite: http.SameSiteStrictMode,
		Path:     "/api/v1/auth",
		MaxAge:   -1,
		Expires:  pastTime,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     sidCookie,
		Value:    "",
		HttpOnly: false,
		Secure:   h.isProduction(),
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
		MaxAge:   -1,
		Expires:  pastTime,
	})
}

// Register godoc
// @Summary Register a new user
// @Description Creates a new attendee or organiser account
// @Tags Auth
// @Accept json
// @Produce json
// @Param input body service.RegisterInput true "Register payload"
// @Success 201 {object} authDataResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /auth/register [post]
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var input service.RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	// organiser registration — no tokens issued, pending admin approval
	if repository.UserRole(input.Role) == repository.UserRoleORGANISER {
		result, err := h.auth.RegisterOrganiser(r.Context(), input)
		if err != nil {
			response.WriteError(w, err)
			return
		}
		response.WriteJSON(w, http.StatusCreated, toOrganiserPendingResponse(result))
		return
	}

	// attendee registration — tokens issued immediately
	result, err := h.auth.Register(r.Context(), input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	h.setSessionCookies(w, result.RefreshToken)
	response.WriteJSON(w, http.StatusCreated, toAuthDataResponse(result))
}

// Login godoc
// @Summary Login user
// @Description Authenticates user and returns access token; sets session cookies
// @Tags Auth
// @Accept json
// @Produce json
// @Param input body service.LoginInput true "Login payload"
// @Success 200 {object} authDataResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /auth/login [post]
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input service.LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	result, err := h.auth.Login(r.Context(), input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	h.setSessionCookies(w, result.RefreshToken)
	response.WriteJSON(w, http.StatusOK, toAuthDataResponse(result))
}

// RefreshAccessToken godoc
// @Summary Refresh access token
// @Description Rotates the refresh token and issues a new access token.
// @Description Note: if two tabs refresh simultaneously, one will fail with INVALID_TOKEN
// @Description and the client will be logged out. This is acceptable behaviour for
// @Description a single-device session model.
// @Tags Auth
// @Produce json
// @Success 200 {object} authDataResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /auth/refresh [post]
func (h *AuthHandler) RefreshAccessToken(w http.ResponseWriter, r *http.Request) {
	for _, c := range r.Cookies() {
		log.Printf("cookie received: name=%s value=%s", c.Name, c.Value)
	}

	cookie, err := r.Cookie(refreshTokenCookie)
	if err != nil {
		// clear cookies if the refresh token is missing
		h.clearSessionCookies(w)
		response.WriteError(w, response.ErrUnauthorized)
		return
	}

	result, err := h.auth.RefreshAccessToken(r.Context(), cookie.Value)
	if err != nil {
		// clear cookies if the refresh token is invalid or expired
		h.clearSessionCookies(w)
		response.WriteError(w, err)
		return
	}

	h.setSessionCookies(w, result.RefreshToken)
	response.WriteJSON(w, http.StatusOK, toAuthDataResponse(result))
}

// ForgotPassword godoc
// @Summary Request password reset
// @Description Sends a reset link if the account exists (prevents email enumeration)
// @Tags Auth
// @Accept json
// @Produce json
// @Param input body service.ForgotPasswordInput true "Forgot password payload"
// @Success 200 {object} map[string]string
// @Failure 400 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /auth/forgot-password [post]
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var input service.ForgotPasswordInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	if err := h.auth.ForgotPassword(r.Context(), input); err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]string{
		"message": "if an account exists with that email, a reset link has been sent",
	})
}

// ResetPassword godoc
// @Summary Reset user password
// @Description Resets password using a reset token
// @Tags Auth
// @Accept json
// @Produce json
// @Param input body service.ResetPasswordInput true "Reset password payload"
// @Success 200 {object} map[string]string
// @Failure 400 {object} response.ErrorResponse
// @Failure 401 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /auth/reset-password [post]
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var input service.ResetPasswordInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, response.ErrInvalidInput)
		return
	}

	if err := h.auth.ResetPassword(r.Context(), input); err != nil {
		response.WriteError(w, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]string{
		"message": "password reset successfully, please log in",
	})
}

// Logout godoc
// @Summary Logout user
// @Description Invalidates refresh token and clears both session cookies
// @Tags Auth
// @Produce json
// @Success 200 {object} nil
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(refreshTokenCookie)
	if err != nil {
		// no cookie present — clear anyway and return clean
		h.clearSessionCookies(w)
		response.WriteJSON(w, http.StatusOK, nil)
		return
	}

	if err := h.auth.Logout(r.Context(), cookie.Value); err != nil {
		// token already revoked or not found — still a clean logout
		h.clearSessionCookies(w)
		response.WriteJSON(w, http.StatusOK, nil)
		return
	}

	h.clearSessionCookies(w)
	response.WriteJSON(w, http.StatusOK, nil)
}
