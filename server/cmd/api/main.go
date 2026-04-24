package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/knnedy/nafasi/internal/config"
	"github.com/knnedy/nafasi/internal/handler"
	"github.com/knnedy/nafasi/internal/notifications"
	"github.com/knnedy/nafasi/internal/repository"
	"github.com/knnedy/nafasi/internal/router"
	"github.com/knnedy/nafasi/internal/service"
	"github.com/knnedy/nafasi/internal/token"
)

func main() {
	// setup structured logger first so all startup errors are logged
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	// load config
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	// connect to database
	db, err := repository.NewDB(cfg.DBUrl)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Pool.Close()
	slog.Info("connected to database")

	// initialize token manager
	tokens := token.NewTokenManager(cfg.JWTSecret)

	// initialize services
	mpesaService := service.NewMpesaService(cfg)
	authService := service.NewAuthService(db.Queries(), tokens)
	userService := service.NewUserService(db.Queries())
	eventService := service.NewEventService(db.Queries())
	ticketService := service.NewTicketTypeService(db.Queries())
	emailService := notifications.NewEmailService(cfg.ResendAPIKey, cfg.ResendFromEmail)
	paymentService := service.NewPaymentService(db, mpesaService, emailService)

	// initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	eventHandler := handler.NewEventHandler(eventService)
	ticketTypeHandler := handler.NewTicketTypeHandler(ticketService)
	paymentHandler := handler.NewPaymentHandler(paymentService)

	// initialize router
	r := router.New(
		db,
		tokens,
		authHandler,
		userHandler,
		eventHandler,
		ticketTypeHandler,
		paymentHandler,
	)

	// configure server with timeouts
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// start server in a goroutine so it doesn't block shutdown handling
	serverErr := make(chan error, 1)
	go func() {
		slog.Info("starting server", "address", srv.Addr, "env", cfg.Env)
		serverErr <- srv.ListenAndServe()
	}()

	// wait for interrupt signal or server error
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-serverErr:
		slog.Error("server error", "error", err)
		os.Exit(1)
	case sig := <-quit:
		slog.Info("shutting down server", "signal", sig)
	}

	// graceful shutdown — give in-flight requests 10 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("forced shutdown", "error", err)
		os.Exit(1)
	}

	slog.Info("server stopped")
}
