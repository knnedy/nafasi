package router

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "github.com/knnedy/nafasi/docs"
	"github.com/knnedy/nafasi/internal/handler"
	"github.com/knnedy/nafasi/internal/middleware"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/token"
	httpSwagger "github.com/swaggo/http-swagger/v2"
)

func New(
	apiVersion string,
	clientURL string,
	tokens *token.TokenManager,
	auth *handler.AuthHandler,
	user *handler.UserHandler,
	event *handler.EventHandler,
	ticketType *handler.TicketTypeHandler,
	payment *handler.PaymentHandler,
	checkin *handler.CheckInHandler,
	organiser *handler.OrganiserHandler,
	admin *handler.AdminHandler,
) http.Handler {
	r := chi.NewRouter()

	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{clientURL},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(chimiddleware.CleanPath)
	r.Use(chimiddleware.Compress(5))
	r.Use(middleware.Logger)

	authMiddleware := middleware.NewAuthMiddleware(tokens)

	// swagger docs
	r.Get("/docs/*", httpSwagger.Handler(
		httpSwagger.URL("/docs/doc.json"),
	))

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

		// event categories — public read
		r.Get("/event-categories", event.GetEventCategories)

		// events — public read + organiser writes
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
				r.Get("/me/orders", user.GetMyOrders)
			})

			// payments
			r.Route("/payments", func(r chi.Router) {
				r.Post("/initiate", payment.InitiatePayment)
				r.Get("/status/{orderID}", payment.QueryPaymentStatus)
			})

			// checkin — organiser only
			r.Route("/checkin", func(r chi.Router) {
				r.Use(authMiddleware.RequireRole(repository.UserRoleORGANISER))
				r.Post("/", checkin.CheckIn)
				r.Get("/{eventID}", checkin.GetCheckedInOrders)
			})
		})

		// organiser dashboard — organiser only
		r.Route("/organiser", organiserRouter(organiser, authMiddleware))

		// admin dashboard — admin only
		r.Route("/admin", adminRouter(admin, authMiddleware))
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
		r.Get("/slug/{slug}", event.GetBySlug)
		r.Get("/{eventID}", event.GetByID)
		r.Get("/{eventID}/ticket-types/available", ticketType.GetAvailableByEvent)
		r.Get("/{eventID}/ticket-types/{ticketTypeID}", ticketType.GetByID)

		// organiser writes
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.Authenticate)
			r.Use(authMiddleware.RequireRole(repository.UserRoleORGANISER))

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

func organiserRouter(
	organiser *handler.OrganiserHandler,
	authMiddleware *middleware.AuthMiddleware,
) func(r chi.Router) {
	return func(r chi.Router) {
		r.Use(authMiddleware.Authenticate)
		r.Use(authMiddleware.RequireRole(repository.UserRoleORGANISER))

		r.Get("/events", organiser.GetEventsByOrganiser)

		r.Route("/events/{eventID}", func(r chi.Router) {
			r.Get("/ticket-types", organiser.GetTicketTypesByEvent)
			r.Get("/ticket-types/sales", organiser.GetTicketTypeSalesByEvent)
			r.Get("/tickets-sold", organiser.GetTotalTicketsSold)
			r.Get("/revenue", organiser.GetEventRevenue)
			r.Get("/checkin/count", organiser.GetEventCheckedInCount)

			r.Route("/orders", func(r chi.Router) {
				r.Get("/", organiser.GetOrdersByOrganiser)
				r.Get("/event", organiser.GetOrdersByEvent)
				r.Get("/recent", organiser.GetRecentEventOrders)
				r.Get("/count", organiser.GetEventOrdersCount)
				r.Get("/breakdown", organiser.GetEventOrderStatusBreakdown)
			})
		})
	}
}

func adminRouter(
	admin *handler.AdminHandler,
	authMiddleware *middleware.AuthMiddleware,
) func(r chi.Router) {
	return func(r chi.Router) {
		r.Use(authMiddleware.Authenticate)
		r.Use(authMiddleware.RequireRole(repository.UserRoleADMIN))

		// user management
		r.Route("/users", func(r chi.Router) {
			r.Get("/", admin.GetUsers)

			r.Route("/{userID}", func(r chi.Router) {
				r.Get("/", admin.GetUserByID)
				r.Patch("/verification", admin.UpdateOrganiserVerification)
				r.Patch("/ban", admin.BanUser)
				r.Patch("/unban", admin.UnbanUser)
				r.Patch("/promote", admin.PromoteToAdmin)
				r.Delete("/", admin.DeleteUser)
			})
		})

		// organiser management
		r.Route("/organisers", func(r chi.Router) {
			r.Get("/", admin.GetOrganisers)
		})

		// event category management
		r.Route("/event-categories", func(r chi.Router) {
			r.Post("/", admin.CreateEventCategory)
			r.Patch("/{categoryID}", admin.UpdateEventCategory)
			r.Delete("/{categoryID}", admin.DeleteEventCategory)
		})

		// event management
		r.Route("/events", func(r chi.Router) {
			r.Get("/", admin.GetEvents)

			r.Route("/{eventID}", func(r chi.Router) {
				r.Patch("/cancel", admin.CancelEvent)
				r.Delete("/", admin.DeleteEvent)
			})
		})

		// order management
		r.Route("/orders", func(r chi.Router) {
			r.Get("/", admin.GetOrdersByStatus)
			r.Get("/recent", admin.GetRecentOrdersWithDetails)
		})

		// platform stats
		r.Get("/stats", admin.GetPlatformStats)
	}
}
