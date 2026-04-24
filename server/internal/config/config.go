package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBUrl               string
	JWTSecret           string
	Port                string
	Env                 string
	MpesaConsumerKey    string
	MpesaConsumerSecret string
	MpesaShortcode      string
	MpesaPasskey        string
	MpesaEnv            string
	MpesaCallbackURL    string
	ResendAPIKey        string
	ResendFromEmail     string
}

func Load() (*Config, error) {
	// only load .env file in development
	if os.Getenv("ENV") != "production" {
		if err := godotenv.Load(); err != nil {
			return nil, fmt.Errorf("error loading .env file: %w", err)
		}
	}

	cfg := &Config{
		Port:     getOrDefault("PORT", "8000"),
		Env:      getOrDefault("ENV", "development"),
		MpesaEnv: getOrDefault("MPESA_ENV", "sandbox"),
	}

	required := map[string]*string{
		"DATABASE_URL":          &cfg.DBUrl,
		"JWT_SECRET":            &cfg.JWTSecret,
		"MPESA_CONSUMER_KEY":    &cfg.MpesaConsumerKey,
		"MPESA_CONSUMER_SECRET": &cfg.MpesaConsumerSecret,
		"MPESA_SHORTCODE":       &cfg.MpesaShortcode,
		"MPESA_PASSKEY":         &cfg.MpesaPasskey,
		"MPESA_CALLBACK_URL":    &cfg.MpesaCallbackURL,
		"RESEND_API_KEY":        &cfg.ResendAPIKey,
		"RESEND_FROM_EMAIL":     &cfg.ResendFromEmail,
	}

	for key, dest := range required {
		val := os.Getenv(key)
		if val == "" {
			return nil, fmt.Errorf("missing required environment variable: %s", key)
		}
		*dest = val
	}

	return cfg, nil
}

func getOrDefault(key, defaultVal string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	return val
}
