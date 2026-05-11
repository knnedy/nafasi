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

// sharedHead returns the common <head> block used across all emails.
func sharedHead() string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
</head>`
}

// sharedWrapper wraps content in the outer dark shell with navbar and footer.
// badge is the top-right label e.g. "Security Notice".
// content is the inner card HTML.
func sharedWrapper(badge, content string) string {
	return fmt.Sprintf(`
<body style="margin:0;padding:0;background-color:#0C0A09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#0C0A09;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%%;">

          <!-- navbar -->
          <tr>
            <td style="padding-bottom:36px;">
              <table width="100%%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- logo mark -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:linear-gradient(135deg,#f97316,#f59e0b);border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                          <span style="font-size:16px;color:#fff;font-weight:900;line-height:32px;">N</span>
                        </td>
                        <td style="padding-left:10px;vertical-align:middle;">
                          <span style="font-size:13px;font-weight:900;letter-spacing:0.2em;color:#fff;text-transform:uppercase;">NAFASI</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="font-size:10px;letter-spacing:0.2em;color:#ffffff33;text-transform:uppercase;font-weight:700;">%s</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- top accent line -->
          <tr>
            <td style="padding-bottom:32px;">
              <div style="height:1px;background:linear-gradient(to right,#f97316,#f59e0b,transparent);"></div>
            </td>
          </tr>

          <!-- card -->
          <tr>
            <td style="background-color:#111009;border:1px solid #ffffff0f;border-radius:16px;overflow:hidden;">
              %s
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="padding-top:28px;" align="center">
              <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:0.15em;color:#ffffff20;text-transform:uppercase;font-weight:700;">The Nafasi Team</p>
              <p style="margin:0;font-size:11px;color:#ffffff15;">Discover. Book. Experience.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`, badge, content)
}

// cardBody builds the inner card content with an orange top stripe, label, heading, body, and optional CTA.
func cardBody(label, heading, body, ctaHTML string) string {
	return fmt.Sprintf(`
  <!-- orange top stripe -->
  <div style="height:3px;background:linear-gradient(to right,#f97316,#f59e0b);"></div>
  <div style="padding:44px 40px;">
    <!-- label -->
    <p style="margin:0 0 10px 0;font-size:10px;letter-spacing:0.25em;color:#f97316;text-transform:uppercase;font-weight:800;">%s</p>
    <!-- heading -->
    <h1 style="margin:0 0 24px 0;font-size:30px;font-weight:900;color:#fff;line-height:1.1;letter-spacing:-0.02em;">%s</h1>
    <!-- body -->
    %s
    <!-- cta -->
    %s
    <!-- bottom note divider -->
    <div style="height:1px;background:#ffffff08;margin-top:32px;margin-bottom:24px;"></div>
    <p style="margin:0;font-size:12px;line-height:1.6;color:#ffffff30;">
      Sent by NAFASI · Nairobi, Kenya
    </p>
  </div>`, label, heading, body, ctaHTML)
}

// orangeButton returns a full-width-ish CTA button styled with the orange gradient.
func orangeButton(href, label string) string {
	return fmt.Sprintf(`
  <table cellpadding="0" cellspacing="0" style="margin:32px 0 0 0;">
    <tr>
      <td style="background:linear-gradient(135deg,#f97316,#f59e0b);border-radius:10px;">
        <a href="%s"
           style="display:inline-block;padding:14px 32px;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#0C0A09;text-decoration:none;font-weight:900;">
          %s &rarr;
        </a>
      </td>
    </tr>
  </table>`, href, label)
}

func (s *EmailService) SendPasswordReset(toEmail, resetURL string) error {
	body := `
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#ffffff60;">
      Someone requested a password reset for your NAFASI account. If this was you, click the button below to choose a new password.
    </p>
    <p style="margin:0;font-size:12px;line-height:1.6;color:#ffffff30;font-family:monospace;letter-spacing:0.05em;">
      &#8594; This link expires in <strong style="color:#f97316;">1 hour</strong>.
    </p>`

	cta := orangeButton(resetURL, "Reset Password")

	card := cardBody("Security Notice", "A reset was<br>requested.", body, cta)
	html := sharedHead() + sharedWrapper("Password Reset", card)

	params := &resend.SendEmailRequest{
		From:    fmt.Sprintf("NAFASI <%s>", s.fromEmail),
		To:      []string{toEmail},
		Subject: "Reset your NAFASI password",
		Html:    html,
	}
	_, err := s.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("email: failed to send password reset: %w", err)
	}
	return nil
}

func (s *EmailService) SendOrganiserApprovalPending(toEmail, name string) error {
	body := fmt.Sprintf(`
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#ffffff60;">
      Hi <strong style="color:#fff;">%s</strong>,<br><br>
      Thanks for applying to become an organiser on NAFASI. We're reviewing your application and will get back to you within <strong style="color:#f97316;">1–2 business days</strong>.
    </p>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#ffffff30;">
      No action is needed from you at this time. You'll receive another email once a decision has been made.
    </p>`, name)

	// info box
	infoBox := `
    <table width="100%%" cellpadding="0" cellspacing="0" style="margin:28px 0 0 0;">
      <tr>
        <td style="background:#f9731608;border:1px solid #f9731620;border-radius:10px;padding:16px 20px;">
          <p style="margin:0;font-size:12px;line-height:1.7;color:#f9731699;font-family:monospace;letter-spacing:0.03em;">
            &#8594; Organiser accounts require admin approval before you can create events.
          </p>
        </td>
      </tr>
    </table>`

	card := cardBody("Application Status", "Your application<br>is under review.", body+infoBox, "")
	html := sharedHead() + sharedWrapper("Organiser Request", card)

	params := &resend.SendEmailRequest{
		From:    fmt.Sprintf("NAFASI <%s>", s.fromEmail),
		To:      []string{toEmail},
		Subject: "Your NAFASI organiser account is under review",
		Html:    html,
	}
	_, err := s.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("email: failed to send organiser pending approval: %w", err)
	}
	return nil
}

func (s *EmailService) SendOrganiserApprovalGranted(toEmail, name string) error {
	body := fmt.Sprintf(`
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#ffffff60;">
      Hi <strong style="color:#fff;">%s</strong>,<br><br>
      Great news — your organiser account has been approved. You can now create and manage events on NAFASI.
    </p>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#ffffff30;">
      Head to your dashboard to get started. We're excited to see what you build.
    </p>`, name)

	cta := orangeButton(s.clientURL+"/signin", "Start Creating")

	card := cardBody("Organiser Approved", "You're officially<br>an organiser.", body, cta)
	html := sharedHead() + sharedWrapper("Approved", card)

	params := &resend.SendEmailRequest{
		From:    fmt.Sprintf("NAFASI <%s>", s.fromEmail),
		To:      []string{toEmail},
		Subject: "You're now an approved NAFASI organiser",
		Html:    html,
	}
	_, err := s.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("email: failed to send organiser approved email: %w", err)
	}
	return nil
}

func (s *EmailService) SendTicketConfirmation(toEmail, eventTitle, qrCode string) error {
	body := fmt.Sprintf(`
    <p style="margin:0 0 28px 0;font-size:15px;line-height:1.7;color:#ffffff60;">
      Your ticket for <strong style="color:#fff;">%s</strong> is confirmed. Show the code below at the entrance.
    </p>
    <!-- QR / code block -->
    <table width="100%%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#0a0805;border:1px solid #ffffff0d;border-top:2px solid #f97316;border-radius:12px;padding:28px 24px;text-align:center;">
          <p style="margin:0 0 16px 0;font-size:10px;letter-spacing:0.3em;color:#ffffff25;text-transform:uppercase;font-weight:700;">Entry Code</p>
          <p style="margin:0 0 16px 0;font-family:monospace;font-size:13px;color:#f97316;word-break:break-all;line-height:1.8;letter-spacing:0.06em;">%s</p>
          <div style="height:1px;background:#ffffff08;margin:20px 0;"></div>
          <p style="margin:0;font-size:10px;letter-spacing:0.2em;color:#ffffff20;text-transform:uppercase;font-weight:700;">Present at entrance</p>
        </td>
      </tr>
    </table>
    <p style="margin:28px 0 0 0;font-size:13px;line-height:1.6;color:#ffffff30;">
      Show this email at the door. We look forward to seeing you there.
    </p>`, eventTitle, qrCode)

	card := cardBody("You're Going", "Your ticket is<br>confirmed.", body, "")
	html := sharedHead() + sharedWrapper("Ticket Confirmed", card)

	params := &resend.SendEmailRequest{
		From:    fmt.Sprintf("NAFASI <%s>", s.fromEmail),
		To:      []string{toEmail},
		Subject: fmt.Sprintf("Your ticket for %s", eventTitle),
		Html:    html,
	}
	_, err := s.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("email: failed to send ticket confirmation: %w", err)
	}
	return nil
}
