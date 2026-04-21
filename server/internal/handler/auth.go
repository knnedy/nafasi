package handler

import (
	"encoding/json"
	"net/http"

	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
)

type AuthHandler struct {
	auth *service.AuthService
}

func NewAuthHandler(auth *service.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

// authDataResponse is the data envelope returned on register, login and refresh
type authDataResponse struct {
	User        UserResponse `json:"user"`
	AccessToken string       `json:"access_token"`
}

func toAuthDataResponse(result service.AuthResult) authDataResponse {
	return authDataResponse{
		User:        toUserResponse(result.User),
		AccessToken: result.AccessToken,
	}
}

func setRefreshTokenCookie(w http.ResponseWriter, refreshToken string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Path:     "/api/v1/auth/refresh",
		MaxAge:   7 * 24 * 60 * 60, // 7 days in seconds — matches refresh token duration
	})
}

func clearRefreshTokenCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		Path:     "/api/v1/auth/refresh",
		MaxAge:   -1,
	})
}

// POST  /v1/auth/register
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var input service.RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, err)
		return
	}

	result, err := h.auth.Register(r.Context(), input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	setRefreshTokenCookie(w, result.RefreshToken)
	response.WriteJSON(w, http.StatusCreated, toAuthDataResponse(result))
}

// POST /v1/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input service.LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.WriteError(w, err)
		return
	}

	result, err := h.auth.Login(r.Context(), input)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	setRefreshTokenCookie(w, result.RefreshToken)
	response.WriteJSON(w, http.StatusOK, toAuthDataResponse(result))
}

// POST /v1/auth/refresh
func (h *AuthHandler) RefreshAccessToken(w http.ResponseWriter, r *http.Request) {
	// read refresh token from httponly cookie
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		response.WriteError(w, err)
		return
	}

	result, err := h.auth.RefreshAccessToken(r.Context(), cookie.Value)
	if err != nil {
		response.WriteError(w, err)
		return
	}

	setRefreshTokenCookie(w, result.RefreshToken)
	response.WriteJSON(w, http.StatusOK, toAuthDataResponse(result))
}

// POST /v1/auth/logout
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// read refresh token from httponly cookie
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		response.WriteError(w, err)
		return
	}

	if err := h.auth.Logout(r.Context(), cookie.Value); err != nil {
		response.WriteError(w, err)
		return
	}

	clearRefreshTokenCookie(w)
	response.WriteJSON(w, http.StatusOK, nil)
}
