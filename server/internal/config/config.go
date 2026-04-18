package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBUrl                 string
	JWTSecret             string
	Port                  string
	Env                   string
	MPESA_CONSUMER_KEY    string
	MPESA_CONSUMER_SECRET string
	MPESA_SHORTCODE       string
	MPESA_PASSKEY         string
	MPESA_ENV             string
	MPESA_CALLBACK_URL    string
}

func Load() Config {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	return Config{
		DBUrl:                 mustGet("DATABASE_URL"),
		JWTSecret:             mustGet("JWT_SECRET"),
		Port:                  getOrDefault("PORT", "8080"),
		Env:                   getOrDefault("ENV", "development"),
		MPESA_CONSUMER_KEY:    mustGet("MPESA_CONSUMER_KEY"),
		MPESA_CONSUMER_SECRET: mustGet("MPESA_CONSUMER_SECRET"),
		MPESA_SHORTCODE:       mustGet("MPESA_SHORTCODE"),
		MPESA_PASSKEY:         mustGet("MPESA_PASSKEY"),
		MPESA_ENV:             getOrDefault("MPESA_ENV", "sandbox"),
		MPESA_CALLBACK_URL:    mustGet("MPESA_CALLBACK_URL"),
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
