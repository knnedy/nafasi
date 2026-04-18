package config

import (
	"log"
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
}

func Load() Config {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	return Config{
		DBUrl:               mustGet("DATABASE_URL"),
		JWTSecret:           mustGet("JWT_SECRET"),
		Port:                getOrDefault("PORT", "8080"),
		Env:                 getOrDefault("ENV", "development"),
		MpesaConsumerKey:    mustGet("MPESA_CONSUMER_KEY"),
		MpesaConsumerSecret: mustGet("MPESA_CONSUMER_SECRET"),
		MpesaShortcode:      mustGet("MPESA_SHORTCODE"),
		MpesaPasskey:        mustGet("MPESA_PASSKEY"),
		MpesaEnv:            getOrDefault("MPESA_ENV", "sandbox"),
		MpesaCallbackURL:    mustGet("MPESA_CALLBACK_URL"),
	}
}

func mustGet(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("missing required environment variable: %s", key)
	}
	return val
}

func getOrDefault(key, defaultVal string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	return val
}
