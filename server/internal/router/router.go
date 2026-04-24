package router

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/knnedy/nafasi/internal/handler"
	"github.com/knnedy/nafasi/internal/middleware"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/token"
)

func New(
	db *repository.DB,
	tokens *token.TokenManager,
	auth *handler.AuthHandler,
	user *handler.UserHandler,
	event *handler.EventHandler,
	ticketType *handler.TicketTypeHandler,
	payment *handler.PaymentHandler,
	checkin *handler.CheckInHandler,
) http.Handler {
	r := chi.NewRouter()

	// global middleware
	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.Logger)

	authMiddleware := middleware.NewAuthMiddleware(tokens)

	r.Route("/api/v1", func(r chi.Router) {

		// Public routes
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", auth.Register)
			r.Post("/login", auth.Login)
			r.Post("/refresh", auth.RefreshAccessToken)
			r.Post("/forgot-password", auth.ForgotPassword)
			r.Post("/reset-password", auth.ResetPassword)
			r.Post("/logout", auth.Logout)
		})

		// mpesa callback — public, Safaricom has no JWT
		r.Post("/payments/mpesa/callback", payment.MpesaCallback)

		// events — public routes
		r.Route("/events", func(r chi.Router) {
			r.Get("/published", event.GetPublished)
			r.Get("/upcoming", event.GetUpcoming)
			r.Get("/organiser/{organiserID}", event.GetByOrganiser)
			r.Get("/{eventID}", event.GetById)
			r.Get("/slug/{slug}", event.GetBySlug)

			// ticket types — public read
			r.Get("/{eventID}/ticket-types", ticketType.GetByEvent)
			r.Get("/{eventID}/ticket-types/available", ticketType.GetAvailableByEvent)
			r.Get("/{eventID}/ticket-types/{ticketTypeID}", ticketType.GetById)

			// events & ticket types — authenticated
			r.Group(func(r chi.Router) {
				r.Use(authMiddleware.Authenticate)

				// events — organiser write
				r.Post("/", event.Create)
				r.Patch("/{eventID}", event.Update)
				r.Patch("/{eventID}/status", event.UpdateStatus)
				r.Delete("/{eventID}", event.Delete)

				// ticket types — organiser write
				r.Post("/{eventID}/ticket-types", ticketType.Create)
				r.Patch("/{eventID}/ticket-types/{ticketTypeID}", ticketType.Update)
				r.Delete("/{eventID}/ticket-types/{ticketTypeID}", ticketType.Delete)
			})

		})

		//  Authenticated routes
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.Authenticate)

			// users
			r.Route("/users", func(r chi.Router) {
				r.Get("/me", user.GetMe)
				r.Patch("/me", user.UpdateMe)
				r.Patch("/me/password", user.UpdatePassword)
				r.Delete("/me", user.DeleteMe)
			})

			// payments
			r.Route("/payments", func(r chi.Router) {
				r.Post("/initiate", payment.InitiatePayment)
				r.Get("/status/{orderID}", payment.QueryPaymentStatus)
			})

			// checkin - organiser only
			r.Route("/checkin", func(r chi.Router) {
				r.Post("/", checkin.CheckIn)
				r.Get("/{eventID}", checkin.GetCheckedInOrders)
			})
		})
	})

	return r
}
