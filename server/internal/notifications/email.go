package notifications

import (
	"fmt"

	"github.com/resend/resend-go/v3"
)

type EmailService struct {
	client    *resend.Client
	fromEmail string
	clientURL string
}

func NewEmailService(apiKey, fromEmail, clientURL string) *EmailService {
	return &EmailService{
		client:    resend.NewClient(apiKey),
		fromEmail: fromEmail,
		clientURL: clientURL,
	}
}

func (s *EmailService) SendPasswordReset(toEmail, resetURL string) error {
	params := &resend.SendEmailRequest{
		From:    fmt.Sprintf("Nafasi <%s>", s.fromEmail),
		To:      []string{toEmail},
		Subject: "Reset your Nafasi password",
		Html: fmt.Sprintf(`
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Georgia',serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:40px;">
              <table width="100%%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-family:'Georgia',serif;font-size:22px;font-weight:700;letter-spacing:0.12em;color:#f5f0e8;text-transform:uppercase;">Nafasi</span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;letter-spacing:0.2em;color:#555;text-transform:uppercase;font-family:'Courier New',monospace;">Security Notice</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom:40px;">
              <div style="height:1px;background:linear-gradient(to right,#c9a96e,transparent);"></div>
            </td>
          </tr>

          <!-- Body Card -->
          <tr>
            <td style="background-color:#111;border:1px solid #222;border-radius:2px;padding:48px 40px;">

              <p style="margin:0 0 8px 0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.25em;color:#c9a96e;text-transform:uppercase;">Password Reset</p>
              <h1 style="margin:0 0 28px 0;font-family:'Georgia',serif;font-size:32px;font-weight:400;color:#f5f0e8;line-height:1.2;">A reset was<br>requested.</h1>

              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:#888;font-family:'Georgia',serif;">
                Someone requested a password reset for your Nafasi account. If this was you, click below to choose a new password.
              </p>
              <p style="margin:0 0 36px 0;font-size:13px;line-height:1.6;color:#555;font-family:'Courier New',monospace;">
                ⟶ This link expires in 1 hour.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
                <tr>
                  <td style="background-color:#c9a96e;border-radius:1px;">
                    <a href="%s" style="display:inline-block;padding:14px 36px;font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;font-weight:700;">Reset Password →</a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="height:1px;background:#1e1e1e;margin-bottom:28px;"></div>

              <p style="margin:0;font-size:13px;line-height:1.6;color:#444;font-family:'Georgia',serif;">
                If you didn't request this, no action is needed — your account remains secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;" align="center">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.15em;color:#333;text-transform:uppercase;">— The Nafasi Team</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
		`, resetURL),
	}

	_, err := s.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("email: failed to send password reset: %w", err)
	}

	return nil
}

func (s *EmailService) SendOrganiserApprovalPending(toEmail, name string) error {
	params := &resend.SendEmailRequest{
		From:    fmt.Sprintf("Nafasi <%s>", s.fromEmail),
		To:      []string{toEmail},
		Subject: "Your Nafasi organiser account is under review",
		Html: fmt.Sprintf(`
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Georgia',serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:40px;">
              <table width="100%%">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;letter-spacing:0.12em;color:#f5f0e8;text-transform:uppercase;">Nafasi</span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;letter-spacing:0.2em;color:#555;text-transform:uppercase;font-family:'Courier New',monospace;">Application Status</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom:40px;">
              <div style="height:1px;background:linear-gradient(to right,#c9a96e,transparent);"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#111;border:1px solid #222;padding:48px 40px;">

              <p style="margin:0 0 8px 0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.25em;color:#c9a96e;text-transform:uppercase;">
                Organiser Request
              </p>

              <h1 style="margin:0 0 28px 0;font-size:30px;color:#f5f0e8;font-weight:400;">
                Your application<br>is under review.
              </h1>

              <p style="margin:0 0 16px 0;color:#888;font-size:15px;line-height:1.7;">
                Hi %s,<br><br>
                Thanks for applying to become an organiser on Nafasi.
              </p>

              <p style="margin:0 0 28px 0;color:#666;font-size:14px;line-height:1.7;">
                We're currently reviewing your request. This typically takes 1–2 business days.
                You'll receive another email once a decision has been made.
              </p>

              <div style="height:1px;background:#1e1e1e;margin:28px 0;"></div>

              <p style="margin:0;color:#444;font-size:13px;">
                No action is needed from you at this time.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;text-align:center;">
              <p style="font-family:'Courier New',monospace;font-size:11px;color:#333;letter-spacing:0.15em;text-transform:uppercase;">
                — The Nafasi Team
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
		`, name),
	}

	_, err := s.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("email: failed to send organiser pending approval: %w", err)
	}

	return nil
}

func (s *EmailService) SendOrganiserApprovalGranted(toEmail, name string) error {
	params := &resend.SendEmailRequest{
		From:    fmt.Sprintf("Nafasi <%s>", s.fromEmail),
		To:      []string{toEmail},
		Subject: "You're now an approved Nafasi organiser",
		Html: fmt.Sprintf(`
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Georgia',serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:40px;">
              <table width="100%%">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;letter-spacing:0.12em;color:#f5f0e8;text-transform:uppercase;">Nafasi</span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;letter-spacing:0.2em;color:#555;text-transform:uppercase;font-family:'Courier New',monospace;">Approved</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom:40px;">
              <div style="height:1px;background:linear-gradient(to right,#c9a96e,transparent);"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#111;border:1px solid #222;padding:48px 40px;">

              <p style="margin:0 0 8px 0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.25em;color:#c9a96e;text-transform:uppercase;">
                Organiser Approved
              </p>

              <h1 style="margin:0 0 28px 0;font-size:30px;color:#f5f0e8;font-weight:400;">
                You're officially<br>an organiser.
              </h1>

              <p style="margin:0 0 16px 0;color:#888;font-size:15px;line-height:1.7;">
                Hi %s,<br><br>
                Your organiser account has been approved. You can now create and manage events on Nafasi.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td style="background-color:#c9a96e;">
                    <a href="%s/login" style="display:inline-block;padding:14px 36px;font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;font-weight:700;">
                      Start Creating →
                    </a>
                  </td>
                </tr>
              </table>

              <div style="height:1px;background:#1e1e1e;margin:28px 0;"></div>

              <p style="margin:0;color:#444;font-size:13px;">
                We’re excited to see what you build.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;text-align:center;">
              <p style="font-family:'Courier New',monospace;font-size:11px;color:#333;letter-spacing:0.15em;text-transform:uppercase;">
                — The Nafasi Team
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
		`, name, s.clientURL),
	}

	_, err := s.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("email: failed to send organiser approved email: %w", err)
	}

	return nil
}

func (s *EmailService) SendTicketConfirmation(toEmail, eventTitle, qrCode string) error {
	params := &resend.SendEmailRequest{
		From:    fmt.Sprintf("Nafasi <%s>", s.fromEmail),
		To:      []string{toEmail},
		Subject: fmt.Sprintf("Your ticket for %s", eventTitle),
		Html: fmt.Sprintf(`
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Georgia',serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:40px;">
              <table width="100%%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-family:'Georgia',serif;font-size:22px;font-weight:700;letter-spacing:0.12em;color:#f5f0e8;text-transform:uppercase;">Nafasi</span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;letter-spacing:0.2em;color:#555;text-transform:uppercase;font-family:'Courier New',monospace;">Ticket Confirmed</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom:40px;">
              <div style="height:1px;background:linear-gradient(to right,#c9a96e,transparent);"></div>
            </td>
          </tr>

          <!-- Body Card -->
          <tr>
            <td style="background-color:#111;border:1px solid #222;border-radius:2px;padding:48px 40px;">

              <p style="margin:0 0 8px 0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.25em;color:#c9a96e;text-transform:uppercase;">You're going</p>
              <h1 style="margin:0 0 8px 0;font-family:'Georgia',serif;font-size:32px;font-weight:400;color:#f5f0e8;line-height:1.2;">Your ticket is<br>confirmed.</h1>
              <p style="margin:0 0 36px 0;font-size:15px;color:#666;font-family:'Georgia',serif;font-style:italic;">%s</p>

              <!-- QR Code Block -->
              <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
                <tr>
                  <td style="background-color:#0d0d0d;border:1px solid #2a2a2a;border-top:3px solid #c9a96e;border-radius:2px;padding:32px 24px;text-align:center;">
                    <p style="margin:0 0 20px 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.3em;color:#555;text-transform:uppercase;">Entry QR Code</p>
                    <p style="margin:0 0 20px 0;font-family:'Courier New',monospace;font-size:13px;color:#c9a96e;word-break:break-all;line-height:1.8;letter-spacing:0.05em;">%s</p>
                    <div style="height:1px;background:#1e1e1e;margin:20px 0;"></div>
                    <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;color:#444;text-transform:uppercase;">Present at entrance</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="height:1px;background:#1e1e1e;margin-bottom:28px;"></div>

              <p style="margin:0;font-size:13px;line-height:1.6;color:#444;font-family:'Georgia',serif;">
                Show this email at the door. We look forward to seeing you there.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;" align="center">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.15em;color:#333;text-transform:uppercase;">— The Nafasi Team</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
		`, eventTitle, qrCode),
	}

	_, err := s.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("email: failed to send ticket confirmation: %w", err)
	}

	return nil
}
