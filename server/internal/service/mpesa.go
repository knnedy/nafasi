package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/knnedy/nafasi/internal/config"
)

const (
	sandboxBaseURL    = "https://sandbox.safaricom.co.ke"
	productionBaseURL = "https://api.safaricom.co.ke"

	authEndpoint    = "/oauth/api/v1/generate?grant_type=client_credentials"
	stkPushEndpoint = "/mpesa/stkpush/api/v1/processrequest"
	queryEndpoint   = "/mpesa/stkpushquery/api/v1/query"
)

type MpesaService struct {
	config     *config.Config
	httpClient *http.Client
	baseURL    string
}

func NewMpesaService(cfg *config.Config) *MpesaService {
	baseURL := sandboxBaseURL
	if cfg.MpesaEnv == "production" {
		baseURL = productionBaseURL
	}

	return &MpesaService{
		config:  cfg,
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Auth
type mpesaAuthResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   string `json:"expires_in"`
}

func (s *MpesaService) getAccessToken(ctx context.Context) (string, error) {
	credentials := base64.StdEncoding.EncodeToString(
		[]byte(fmt.Sprintf("%s:%s", s.config.MpesaConsumerKey, s.config.MpesaConsumerSecret)),
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, s.baseURL+authEndpoint, nil)
	if err != nil {
		return "", fmt.Errorf("mpesa: failed to create auth request: %w", err)
	}

	req.Header.Set("Authorization", "Basic "+credentials)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("mpesa: auth request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("mpesa: auth failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result mpesaAuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("mpesa: failed to decode auth response: %w", err)
	}

	return result.AccessToken, nil
}

// STK Push
type STKPushRequest struct {
	PhoneNumber string
	Amount      int64
	OrderID     string
	Description string
}

type STKPushResponse struct {
	MerchantRequestID   string `json:"MerchantRequestID"`
	CheckoutRequestID   string `json:"CheckoutRequestID"`
	ResponseCode        string `json:"ResponseCode"`
	ResponseDescription string `json:"ResponseDescription"`
	CustomerMessage     string `json:"CustomerMessage"`
}

type stkPushPayload struct {
	BusinessShortCode string `json:"BusinessShortCode"`
	Password          string `json:"Password"`
	Timestamp         string `json:"Timestamp"`
	TransactionType   string `json:"TransactionType"`
	Amount            int64  `json:"Amount"`
	PartyA            string `json:"PartyA"`
	PartyB            string `json:"PartyB"`
	PhoneNumber       string `json:"PhoneNumber"`
	CallBackURL       string `json:"CallBackURL"`
	AccountReference  string `json:"AccountReference"`
	TransactionDesc   string `json:"TransactionDesc"`
}

func (s *MpesaService) generatePassword(timestamp string) string {
	raw := fmt.Sprintf("%s%s%s", s.config.MpesaShortcode, s.config.MpesaPasskey, timestamp)
	return base64.StdEncoding.EncodeToString([]byte(raw))
}

func (s *MpesaService) InitiateSTKPush(ctx context.Context, req STKPushRequest) (*STKPushResponse, error) {
	accessToken, err := s.getAccessToken(ctx)
	if err != nil {
		return nil, err
	}

	timestamp := time.Now().Format("20060102150405")
	password := s.generatePassword(timestamp)

	payload := stkPushPayload{
		BusinessShortCode: s.config.MpesaShortcode,
		Password:          password,
		Timestamp:         timestamp,
		TransactionType:   "CustomerPayBillOnline",
		Amount:            req.Amount,
		PartyA:            req.PhoneNumber,
		PartyB:            s.config.MpesaShortcode,
		PhoneNumber:       req.PhoneNumber,
		CallBackURL:       s.config.MpesaCallbackURL,
		AccountReference:  req.OrderID,
		TransactionDesc:   req.Description,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("mpesa: failed to marshal stk push payload: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, s.baseURL+stkPushEndpoint, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("mpesa: failed to create stk push request: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+accessToken)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("mpesa: stk push request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("mpesa: stk push failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result STKPushResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("mpesa: failed to decode stk push response: %w", err)
	}

	if result.ResponseCode != "0" {
		return nil, fmt.Errorf("mpesa: stk push rejected: %s", result.ResponseDescription)
	}

	return &result, nil
}

// STK Query
type STKQueryResponse struct {
	ResponseCode        string `json:"ResponseCode"`
	ResponseDescription string `json:"ResponseDescription"`
	MerchantRequestID   string `json:"MerchantRequestID"`
	CheckoutRequestID   string `json:"CheckoutRequestID"`
	ResultCode          string `json:"ResultCode"`
	ResultDesc          string `json:"ResultDesc"`
}

type stkQueryPayload struct {
	BusinessShortCode string `json:"BusinessShortCode"`
	Password          string `json:"Password"`
	Timestamp         string `json:"Timestamp"`
	CheckoutRequestID string `json:"CheckoutRequestID"`
}

func (s *MpesaService) QuerySTKStatus(ctx context.Context, checkoutRequestID string) (*STKQueryResponse, error) {
	accessToken, err := s.getAccessToken(ctx)
	if err != nil {
		return nil, err
	}

	timestamp := time.Now().Format("20060102150405")
	password := s.generatePassword(timestamp)

	payload := stkQueryPayload{
		BusinessShortCode: s.config.MpesaShortcode,
		Password:          password,
		Timestamp:         timestamp,
		CheckoutRequestID: checkoutRequestID,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("mpesa: failed to marshal query payload: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, s.baseURL+queryEndpoint, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("mpesa: failed to create query request: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+accessToken)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("mpesa: query request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("mpesa: query failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result STKQueryResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("mpesa: failed to decode query response: %w", err)
	}

	return &result, nil
}

// Callback
type MpesaCallback struct {
	Body struct {
		StkCallback struct {
			MerchantRequestID string `json:"MerchantRequestID"`
			CheckoutRequestID string `json:"CheckoutRequestID"`
			ResultCode        int    `json:"ResultCode"`
			ResultDesc        string `json:"ResultDesc"`
			CallbackMetadata  *struct {
				Item []struct {
					Name  string      `json:"Name"`
					Value interface{} `json:"Value"`
				} `json:"Item"`
			} `json:"CallbackMetadata"`
		} `json:"stkCallback"`
	} `json:"Body"`
}

type MpesaCallbackResult struct {
	Success            bool
	MpesaReceiptNumber string
	PhoneNumber        string
	Amount             float64
	TransactionDate    string
	MerchantRequestID  string
	CheckoutRequestID  string
	ResultDesc         string
}

func (s *MpesaService) ParseCallback(callback MpesaCallback) MpesaCallbackResult {
	stk := callback.Body.StkCallback

	result := MpesaCallbackResult{
		Success:           stk.ResultCode == 0,
		MerchantRequestID: stk.MerchantRequestID,
		CheckoutRequestID: stk.CheckoutRequestID,
		ResultDesc:        stk.ResultDesc,
	}

	if !result.Success || stk.CallbackMetadata == nil {
		return result
	}

	for _, item := range stk.CallbackMetadata.Item {
		switch item.Name {
		case "MpesaReceiptNumber":
			if v, ok := item.Value.(string); ok {
				result.MpesaReceiptNumber = v
			}
		case "Amount":
			if v, ok := item.Value.(float64); ok {
				result.Amount = v
			}
		case "PhoneNumber":
			if v, ok := item.Value.(float64); ok {
				result.PhoneNumber = fmt.Sprintf("%.0f", v)
			}
		case "TransactionDate":
			if v, ok := item.Value.(float64); ok {
				result.TransactionDate = fmt.Sprintf("%.0f", v)
			}
		}
	}

	return result
}
