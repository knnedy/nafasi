package main

import (
	"encoding/json"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	amqp "github.com/rabbitmq/amqp091-go"

	"github.com/knnedy/nafasi/internal/config"
	"github.com/knnedy/nafasi/internal/notifications"
	"github.com/knnedy/nafasi/internal/queue"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	conn, err := amqp.Dial(cfg.AMQPUrl)
	if err != nil {
		slog.Error("failed to connect to rabbitmq", "error", err)
		os.Exit(1)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		slog.Error("failed to open channel", "error", err)
		os.Exit(1)
	}
	defer ch.Close()

	// prefetch 1: don't get flooded with messages faster than we can send emails
	if err := ch.Qos(1, 0, false); err != nil {
		slog.Error("failed to set qos", "error", err)
		os.Exit(1)
	}

	emailService := notifications.NewEmailService(cfg.ResendAPIKey, cfg.ResendFromEmail, cfg.ClientURL)

	msgs, err := ch.Consume(
		queue.RoutingKeyEmailSend, // queue name (matches routing key by convention)
		"",                        // consumer tag, auto-generated
		false,                     // auto-ack — false, we ack manually
		false,                     // exclusive
		false,                     // no-local
		false,                     // no-wait
		nil,                       // args
	)
	if err != nil {
		slog.Error("failed to register consumer", "error", err)
		os.Exit(1)
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	slog.Info("worker started, waiting for messages")

	go func() {
		for msg := range msgs {
			handleMessage(emailService, msg)
		}
	}()

	sig := <-quit
	slog.Info("shutting down worker", "signal", sig)
}

func handleMessage(emailService *notifications.EmailService, msg amqp.Delivery) {
	var payload queue.EmailSendPayload
	if err := json.Unmarshal(msg.Body, &payload); err != nil {
		slog.Error("failed to unmarshal email payload, dropping to dlq", "error", err)
		_ = msg.Nack(false, false)
		return
	}

	var sendErr error
	switch payload.Type {
	case "ticket_confirmation":
		sendErr = emailService.SendTicketConfirmation(payload.Email, payload.EventTitle, payload.QRCode)
	default:
		slog.Error("unknown email type, dropping to dlq", "type", payload.Type)
		_ = msg.Nack(false, false)
		return
	}

	if sendErr != nil {
		slog.Error("failed to send email, routing to dlq",
			"error", sendErr,
			"email", payload.Email,
			"type", payload.Type,
		)
		_ = msg.Nack(false, false) // requeue=false -> goes to email.send.dlq
		return
	}

	_ = msg.Ack(false)
	slog.Info("email sent successfully", "email", payload.Email, "type", payload.Type)
}
