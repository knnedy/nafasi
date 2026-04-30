package router

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/knnedy/nafasi/internal/handler"
	"github.com/knnedy/nafasi/internal/middleware"
	"github.com/knnedy/nafasi/internal/token"
	httpSwagger "github.com/swaggo/http-swagger/v2"
)

func New(
	apiVersion string,
	tokens *token.TokenManager,
	auth *handler.AuthHandler,
	user *handler.UserHandler,
	event *handler.EventHandler,
	ticketType *handler.TicketTypeHandler,
	payment *handler.PaymentHandler,
	checkin *handler.CheckInHandler,
) http.Handler {
	r := chi.NewRouter()

	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.CleanPath)
	r.Use(chimiddleware.Compress(5))
	r.Use(middleware.Logger)

	authMiddleware := middleware.NewAuthMiddleware(tokens)

	// swagger outside versioning
	r.Get("/swagger/*", httpSwagger.Handler())

	r.Route(fmt.Sprintf("/api/%s", apiVersion), func(r chi.Router) {

		// auth — public
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", auth.Register)
			r.Post("/login", auth.Login)
			r.Post("/refresh", auth.RefreshAccessToken)
			r.Post("/logout", auth.Logout)
			r.Post("/forgot-password", auth.ForgotPassword)
			r.Post("/reset-password", auth.ResetPassword)
		})

		// mpesa callback — public, Safaricom has no JWT
		r.Post("/payments/mpesa/callback", payment.MpesaCallback)

		// events
		r.Route("/events", eventsRouter(event, ticketType, authMiddleware))

		// authenticated routes
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

			// checkin — organiser only
			r.Route("/checkin", func(r chi.Router) {
				r.Use(authMiddleware.RequireRole("ORGANISER"))
				r.Post("/", checkin.CheckIn)
				r.Get("/{eventID}", checkin.GetCheckedInOrders)
			})
		})
	})

	return r
}

func eventsRouter(
	event *handler.EventHandler,
	ticketType *handler.TicketTypeHandler,
	authMiddleware *middleware.AuthMiddleware,
) func(r chi.Router) {
	return func(r chi.Router) {
		// public read — static before dynamic
		r.Get("/published", event.GetPublished)
		r.Get("/upcoming", event.GetUpcoming)
		r.Get("/organiser/{organiserID}", event.GetByOrganiser)
		r.Get("/slug/{slug}", event.GetBySlug)
		r.Get("/{eventID}", event.GetById)

		// ticket types — static before dynamic
		r.Get("/{eventID}/ticket-types", ticketType.GetByEvent)
		r.Get("/{eventID}/ticket-types/available", ticketType.GetAvailableByEvent)
		r.Get("/{eventID}/ticket-types/{ticketTypeID}", ticketType.GetById)

		// organiser writes
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.Authenticate)
			r.Use(authMiddleware.RequireRole("ORGANISER"))

			r.Post("/", event.Create)
			r.Patch("/{eventID}", event.Update)
			r.Patch("/{eventID}/status", event.UpdateStatus)
			r.Delete("/{eventID}", event.Delete)

			r.Post("/{eventID}/ticket-types", ticketType.Create)
			r.Patch("/{eventID}/ticket-types/{ticketTypeID}", ticketType.Update)
			r.Delete("/{eventID}/ticket-types/{ticketTypeID}", ticketType.Delete)
		})
	}
}
