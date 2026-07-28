package queue

import (
	"context"
	"encoding/json"
	"fmt"

	amqp "github.com/rabbitmq/amqp091-go"
)

const (
	ExchangeName               = "nafasi.events"
	RoutingKeyPaymentConfirmed = "payment.confirmed"
	RoutingKeyEmailSend        = "email.send"
)

// EmailSendPayload is the message contract published to the email.send
// routing key and consumed by the worker.
type EmailSendPayload struct {
	Type       string `json:"type"`
	Email      string `json:"email"`
	EventTitle string `json:"event_title"`
	QRCode     string `json:"qr_code"`
}

// Publisher publishes messages to the message broker.
type Publisher interface {
	Publish(ctx context.Context, routingKey string, payload any) error
	Close() error
}

type rabbitPublisher struct {
	conn *amqp.Connection
	ch   *amqp.Channel
}

// Connect establishes a connection and channel to RabbitMQ, and returns a Publisher.
func Connect(amqpURL string) (Publisher, error) {
	conn, err := amqp.Dial(amqpURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to rabbitmq: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to open channel: %w", err)
	}

	return &rabbitPublisher{conn: conn, ch: ch}, nil
}

func (p *rabbitPublisher) Publish(ctx context.Context, routingKey string, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	err = p.ch.PublishWithContext(ctx,
		ExchangeName,
		routingKey,
		false, // mandatory
		false, // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         body,
			DeliveryMode: amqp.Persistent,
		},
	)
	if err != nil {
		return fmt.Errorf("failed to publish message: %w", err)
	}

	return nil
}

func (p *rabbitPublisher) Close() error {
	if err := p.ch.Close(); err != nil {
		return err
	}
	return p.conn.Close()
}
