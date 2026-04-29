package service_test

import (
	"bytes"
	"context"
	"encoding/base64"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/knnedy/nafasi/internal/config"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// mock HTTP client
type mockHTTPClient struct {
	mock.Mock
}

func (m *mockHTTPClient) Do(req *http.Request) (*http.Response, error) {
	args := m.Called(req)
	return args.Get(0).(*http.Response), args.Error(1)
}

func newTestMpesaService(client *mockHTTPClient) *service.MpesaService {
	cfg := &config.Config{
		MpesaConsumerKey:    "test-consumer-key",
		MpesaConsumerSecret: "test-consumer-secret",
		MpesaShortcode:      "174379",
		MpesaPasskey:        "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
		MpesaEnv:            "sandbox",
		MpesaCallbackURL:    "https://test.ngrok.io/api/v1/payments/mpesa/callback",
	}
	return service.NewMpesaServiceWithClient(cfg, client)
}

func makeAuthResponse() *http.Response {
	body := `{"access_token":"test-token","expires_in":"3599"}`
	return &http.Response{
		StatusCode: http.StatusOK,
		Body:       io.NopCloser(strings.NewReader(body)),
	}
}

func makeSTKPushResponse() *http.Response {
	body := `{
		"MerchantRequestID": "merchant-123",
		"CheckoutRequestID": "checkout-123",
		"ResponseCode": "0",
		"ResponseDescription": "Success",
		"CustomerMessage": "Success"
	}`
	return &http.Response{
		StatusCode: http.StatusOK,
		Body:       io.NopCloser(strings.NewReader(body)),
	}
}

func makeErrorResponse(status int, body string) *http.Response {
	return &http.Response{
		StatusCode: status,
		Body:       io.NopCloser(bytes.NewBufferString(body)),
	}
}

// ParseCallback

func TestParseCallback_Success(t *testing.T) {
	client := new(mockHTTPClient)
	svc := newTestMpesaService(client)

	callback := service.MpesaCallback{}
	callback.Body.StkCallback.ResultCode = 0
	callback.Body.StkCallback.MerchantRequestID = "merchant-123"
	callback.Body.StkCallback.CheckoutRequestID = "checkout-123"
	callback.Body.StkCallback.ResultDesc = "The service request is processed successfully."
	callback.Body.StkCallback.CallbackMetadata = &struct {
		Item []struct {
			Name  string      `json:"Name"`
			Value interface{} `json:"Value"`
		} `json:"Item"`
	}{
		Item: []struct {
			Name  string      `json:"Name"`
			Value interface{} `json:"Value"`
		}{
			{Name: "MpesaReceiptNumber", Value: "NLJ7RT61SV"},
			{Name: "Amount", Value: float64(1000)},
			{Name: "PhoneNumber", Value: float64(254712345678)},
			{Name: "TransactionDate", Value: float64(20231201120000)},
		},
	}

	result := svc.ParseCallback(callback)

	assert.True(t, result.Success)
	assert.Equal(t, "NLJ7RT61SV", result.MpesaReceiptNumber)
	assert.Equal(t, float64(1000), result.Amount)
	assert.Equal(t, "254712345678", result.PhoneNumber)
	assert.Equal(t, "merchant-123", result.MerchantRequestID)
	assert.Equal(t, "checkout-123", result.CheckoutRequestID)
}

func TestParseCallback_Failed(t *testing.T) {
	client := new(mockHTTPClient)
	svc := newTestMpesaService(client)

	callback := service.MpesaCallback{}
	callback.Body.StkCallback.ResultCode = 1032
	callback.Body.StkCallback.ResultDesc = "Request cancelled by user"
	callback.Body.StkCallback.CheckoutRequestID = "checkout-123"

	result := svc.ParseCallback(callback)

	assert.False(t, result.Success)
	assert.Equal(t, "Request cancelled by user", result.ResultDesc)
	assert.Empty(t, result.MpesaReceiptNumber)
}

func TestParseCallback_NoMetadata(t *testing.T) {
	client := new(mockHTTPClient)
	svc := newTestMpesaService(client)

	callback := service.MpesaCallback{}
	callback.Body.StkCallback.ResultCode = 1
	callback.Body.StkCallback.ResultDesc = "Insufficient funds"

	result := svc.ParseCallback(callback)

	assert.False(t, result.Success)
	assert.Empty(t, result.MpesaReceiptNumber)
	assert.Zero(t, result.Amount)
}

// InitiateSTKPush

func TestInitiateSTKPush_Success(t *testing.T) {
	client := new(mockHTTPClient)
	svc := newTestMpesaService(client)

	// first call is auth, second is STK push
	client.On("Do", mock.MatchedBy(func(r *http.Request) bool {
		return strings.Contains(r.URL.String(), "oauth")
	})).Return(makeAuthResponse(), nil).Once()

	client.On("Do", mock.MatchedBy(func(r *http.Request) bool {
		return strings.Contains(r.URL.String(), "stkpush")
	})).Return(makeSTKPushResponse(), nil).Once()

	resp, err := svc.InitiateSTKPush(context.Background(), service.STKPushRequest{
		PhoneNumber: "254712345678",
		Amount:      1000,
		OrderID:     "order-123",
		Description: "Ticket Payment",
	})

	assert.NoError(t, err)
	assert.Equal(t, "checkout-123", resp.CheckoutRequestID)
	assert.Equal(t, "0", resp.ResponseCode)
	client.AssertExpectations(t)
}

func TestInitiateSTKPush_AuthFailed(t *testing.T) {
	client := new(mockHTTPClient)
	svc := newTestMpesaService(client)

	client.On("Do", mock.MatchedBy(func(r *http.Request) bool {
		return strings.Contains(r.URL.String(), "oauth")
	})).Return(makeErrorResponse(http.StatusUnauthorized, `{"error":"invalid credentials"}`), nil).Once()

	_, err := svc.InitiateSTKPush(context.Background(), service.STKPushRequest{
		PhoneNumber: "254712345678",
		Amount:      1000,
		OrderID:     "order-123",
		Description: "Ticket Payment",
	})

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "auth failed")
	client.AssertExpectations(t)
}

func TestInitiateSTKPush_STKRejected(t *testing.T) {
	client := new(mockHTTPClient)
	svc := newTestMpesaService(client)

	client.On("Do", mock.MatchedBy(func(r *http.Request) bool {
		return strings.Contains(r.URL.String(), "oauth")
	})).Return(makeAuthResponse(), nil).Once()

	rejectedBody := `{
		"MerchantRequestID": "merchant-123",
		"CheckoutRequestID": "checkout-123",
		"ResponseCode": "1",
		"ResponseDescription": "Invalid Access Token",
		"CustomerMessage": "Invalid Access Token"
	}`

	client.On("Do", mock.MatchedBy(func(r *http.Request) bool {
		return strings.Contains(r.URL.String(), "stkpush")
	})).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       io.NopCloser(strings.NewReader(rejectedBody)),
	}, nil).Once()

	_, err := svc.InitiateSTKPush(context.Background(), service.STKPushRequest{
		PhoneNumber: "254712345678",
		Amount:      1000,
		OrderID:     "order-123",
		Description: "Ticket Payment",
	})

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "stk push rejected")
	client.AssertExpectations(t)
}

// generatePassword

func TestGeneratePassword(t *testing.T) {
	client := new(mockHTTPClient)
	svc := newTestMpesaService(client)

	password := svc.GeneratePasswordForTest("20231201120000")

	assert.NotEmpty(t, password)
	// base64 encoded so it should only contain valid base64 chars
	_, err := base64.StdEncoding.DecodeString(password)
	assert.NoError(t, err)
}

// formatPhoneNumber

func TestFormatPhoneNumber(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
		hasError bool
	}{
		{"local format", "0712345678", "254712345678", false},
		{"plus format", "+254712345678", "254712345678", false},
		{"already formatted", "254712345678", "254712345678", false},
		{"nine digits", "712345678", "254712345678", false},
		{"invalid prefix", "255712345678", "", true},
		{"too short", "071234", "", true},
		{"with spaces", "0712 345 678", "254712345678", false},
		{"with dashes", "0712-345-678", "254712345678", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.FormatPhoneNumberForTest(tt.input)
			if tt.hasError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}
