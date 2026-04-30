package handler_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/knnedy/nafasi/internal/handler"
	"github.com/knnedy/nafasi/internal/handler/mock"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/response"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/assert"
	mocktestify "github.com/stretchr/testify/mock"
)

func makeCheckInResult() *service.CheckInResult {
	return &service.CheckInResult{
		OrderID:   uuid.New().String(),
		EventID:   uuid.New().String(),
		UserID:    uuid.New().String(),
		CheckedIn: true,
		Message:   "checked in successfully",
	}
}

func makeCheckedInOrders() []repository.Order {
	return []repository.Order{
		{
			ID:        pgtype.UUID{Bytes: uuid.New(), Valid: true},
			Status:    repository.OrderStatusPAID,
			CheckedIn: true,
		},
		{
			ID:        pgtype.UUID{Bytes: uuid.New(), Valid: true},
			Status:    repository.OrderStatusPAID,
			CheckedIn: true,
		},
	}
}

// CheckIn
func TestCheckInHandler_Success(t *testing.T) {
	svc := new(mock.CheckInService)
	h := handler.NewCheckInHandler(svc)

	organiserID := uuid.New().String()
	qrCode := "abc123def456"

	svc.On("CheckIn", mocktestify.Anything, organiserID, qrCode).
		Return(makeCheckInResult(), nil)

	body := map[string]string{"qr_code": qrCode}

	w := httptest.NewRecorder()
	r := withUserID(
		httptest.NewRequest(http.MethodPost, "/api/v1/checkin", toJSON(t, body)),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.CheckIn(w, r)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]any
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.True(t, resp["success"].(bool))

	svc.AssertExpectations(t)
}

func TestCheckInHandler_InvalidBody(t *testing.T) {
	svc := new(mock.CheckInService)
	h := handler.NewCheckInHandler(svc)

	organiserID := uuid.New().String()

	w := httptest.NewRecorder()
	r := withUserID(
		httptest.NewRequest(http.MethodPost, "/api/v1/checkin", nil),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.CheckIn(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

func TestCheckInHandler_EmptyQRCode(t *testing.T) {
	svc := new(mock.CheckInService)
	h := handler.NewCheckInHandler(svc)

	organiserID := uuid.New().String()
	body := map[string]string{"qr_code": ""}

	w := httptest.NewRecorder()
	r := withUserID(
		httptest.NewRequest(http.MethodPost, "/api/v1/checkin", toJSON(t, body)),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.CheckIn(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}

func TestCheckInHandler_AlreadyCheckedIn(t *testing.T) {
	svc := new(mock.CheckInService)
	h := handler.NewCheckInHandler(svc)

	organiserID := uuid.New().String()
	qrCode := "abc123def456"

	svc.On("CheckIn", mocktestify.Anything, organiserID, qrCode).
		Return((*service.CheckInResult)(nil), response.ErrTicketAlreadyCheckedIn)

	body := map[string]string{"qr_code": qrCode}

	w := httptest.NewRecorder()
	r := withUserID(
		httptest.NewRequest(http.MethodPost, "/api/v1/checkin", toJSON(t, body)),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.CheckIn(w, r)

	assert.Equal(t, http.StatusConflict, w.Code)
	svc.AssertExpectations(t)
}

func TestCheckInHandler_NotFound(t *testing.T) {
	svc := new(mock.CheckInService)
	h := handler.NewCheckInHandler(svc)

	organiserID := uuid.New().String()
	qrCode := "invalid-qr-code"

	svc.On("CheckIn", mocktestify.Anything, organiserID, qrCode).
		Return((*service.CheckInResult)(nil), response.ErrNotFound)

	body := map[string]string{"qr_code": qrCode}

	w := httptest.NewRecorder()
	r := withUserID(
		httptest.NewRequest(http.MethodPost, "/api/v1/checkin", toJSON(t, body)),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.CheckIn(w, r)

	assert.Equal(t, http.StatusNotFound, w.Code)
	svc.AssertExpectations(t)
}

func TestCheckInHandler_Forbidden(t *testing.T) {
	svc := new(mock.CheckInService)
	h := handler.NewCheckInHandler(svc)

	organiserID := uuid.New().String()
	qrCode := "abc123def456"

	svc.On("CheckIn", mocktestify.Anything, organiserID, qrCode).
		Return((*service.CheckInResult)(nil), response.ErrForbidden)

	body := map[string]string{"qr_code": qrCode}

	w := httptest.NewRecorder()
	r := withUserID(
		httptest.NewRequest(http.MethodPost, "/api/v1/checkin", toJSON(t, body)),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.CheckIn(w, r)

	assert.Equal(t, http.StatusForbidden, w.Code)
	svc.AssertExpectations(t)
}

func TestCheckInHandler_OrderNotPaid(t *testing.T) {
	svc := new(mock.CheckInService)
	h := handler.NewCheckInHandler(svc)

	organiserID := uuid.New().String()
	qrCode := "abc123def456"

	svc.On("CheckIn", mocktestify.Anything, organiserID, qrCode).
		Return((*service.CheckInResult)(nil), response.ErrOrderNotPaid)

	body := map[string]string{"qr_code": qrCode}

	w := httptest.NewRecorder()
	r := withUserID(
		httptest.NewRequest(http.MethodPost, "/api/v1/checkin", toJSON(t, body)),
		organiserID,
	)
	r.Header.Set("Content-Type", "application/json")

	h.CheckIn(w, r)

	assert.Equal(t, http.StatusConflict, w.Code)
	svc.AssertExpectations(t)
}

// GetCheckedInOrders
func TestGetCheckedInOrdersHandler_Success(t *testing.T) {
	svc := new(mock.CheckInService)
	h := handler.NewCheckInHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetCheckedInOrders", mocktestify.Anything, organiserID, eventID).
		Return(makeCheckedInOrders(), nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodGet, "/api/v1/checkin/"+eventID, nil),
			"eventID", eventID,
		),
		organiserID,
	)

	h.GetCheckedInOrders(w, r)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]any
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.True(t, resp["success"].(bool))

	svc.AssertExpectations(t)
}

func TestGetCheckedInOrdersHandler_Empty(t *testing.T) {
	svc := new(mock.CheckInService)
	h := handler.NewCheckInHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetCheckedInOrders", mocktestify.Anything, organiserID, eventID).
		Return([]repository.Order{}, nil)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodGet, "/api/v1/checkin/"+eventID, nil),
			"eventID", eventID,
		),
		organiserID,
	)

	h.GetCheckedInOrders(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	svc.AssertExpectations(t)
}

func TestGetCheckedInOrdersHandler_Forbidden(t *testing.T) {
	svc := new(mock.CheckInService)
	h := handler.NewCheckInHandler(svc)

	organiserID := uuid.New().String()
	eventID := uuid.New().String()

	svc.On("GetCheckedInOrders", mocktestify.Anything, organiserID, eventID).
		Return([]repository.Order{}, response.ErrForbidden)

	w := httptest.NewRecorder()
	r := withUserID(
		withChiParam(
			httptest.NewRequest(http.MethodGet, "/api/v1/checkin/"+eventID, nil),
			"eventID", eventID,
		),
		organiserID,
	)

	h.GetCheckedInOrders(w, r)

	assert.Equal(t, http.StatusForbidden, w.Code)
	svc.AssertExpectations(t)
}

func TestGetCheckedInOrdersHandler_MissingEventID(t *testing.T) {
	svc := new(mock.CheckInService)
	h := handler.NewCheckInHandler(svc)

	organiserID := uuid.New().String()

	w := httptest.NewRecorder()
	r := withUserID(
		httptest.NewRequest(http.MethodGet, "/api/v1/checkin/", nil),
		organiserID,
	)

	h.GetCheckedInOrders(w, r)

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
}
