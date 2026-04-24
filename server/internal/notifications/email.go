package notifications

import (
	"fmt"

	"github.com/resend/resend-go/v3"
)

type EmailService struct {
	client    *resend.Client
	fromEmail string
}

func NewEmailService(apiKey, fromEmail string) *EmailService {
	return &EmailService{
		client:    resend.NewClient(apiKey),
		fromEmail: fromEmail,
	}
}

func (s *EmailService) SendPasswordReset(toEmail, resetURL string) error {
	params := &resend.SendEmailRequest{
		From:    fmt.Sprintf("Nafasi <%s>", s.fromEmail),
		To:      []string{toEmail},
		Subject: "Reset your Nafasi password",
		Html: fmt.Sprintf(`
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
				<h2>Reset your password</h2>
				<p>You requested a password reset for your Nafasi account.</p>
				<p>Click the button below to reset your password. This link expires in 1 hour.</p>
				<a href="%s" style="
					display: inline-block;
					background-color: #000;
					color: #fff;
					padding: 12px 24px;
					border-radius: 6px;
					text-decoration: none;
					margin: 16px 0;
				">Reset Password</a>
				<p>If you did not request this, you can safely ignore this email.</p>
				<p>— The Nafasi Team</p>
			</div>
		`, resetURL),
	}

	_, err := s.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("email: failed to send password reset: %w", err)
	}

	return nil
}

func (s *EmailService) SendTicketConfirmation(toEmail, eventTitle, qrCode string) error {
	params := &resend.SendEmailRequest{
		From:    fmt.Sprintf("Nafasi <%s>", s.fromEmail),
		To:      []string{toEmail},
		Subject: fmt.Sprintf("Your ticket for %s", eventTitle),
		Html: fmt.Sprintf(`
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
				<h2>Your ticket is confirmed!</h2>
				<p>Thank you for your purchase. Here are your ticket details for <strong>%s</strong>.</p>
				<div style="
					background: #f5f5f5;
					border-radius: 8px;
					padding: 24px;
					margin: 16px 0;
					text-align: center;
				">
					<p style="font-size: 12px; color: #666;">Your QR code</p>
					<p style="font-family: monospace; font-size: 14px; word-break: break-all;">%s</p>
				</div>
				<p>Present this QR code at the event entrance.</p>
				<p>— The Nafasi Team</p>
			</div>
		`, eventTitle, qrCode),
	}

	_, err := s.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("email: failed to send ticket confirmation: %w", err)
	}

	return nil
}
