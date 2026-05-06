package main

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/knnedy/nafasi/internal/repository"
)

var defaultCategories = []struct {
	Name        string
	Description string
}{
	{"Music", "Concerts, festivals and live performances"},
	{"Sports", "Sporting events and tournaments"},
	{"Arts", "Theatre, exhibitions and cultural events"},
	{"Food", "Food festivals, tastings and dining experiences"},
	{"Technology", "Tech conferences, hackathons and meetups"},
	{"Business", "Business conferences and networking events"},
	{"Education", "Workshops, seminars and training sessions"},
	{"Nightlife", "Club nights, parties and entertainment"},
	{"Comedy", "Stand-up shows and comedy events"},
	{"Networking", "Professional networking and social events"},
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("error loading .env file")
	}

	pool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal("failed to connect to database:", err)
	}
	defer pool.Close()

	q := repository.New(pool)

	for _, c := range defaultCategories {
		_, err := q.CreateCategory(context.Background(), repository.CreateCategoryParams{
			Name:        c.Name,
			Description: pgtype.Text{String: c.Description, Valid: true},
		})
		if err != nil {
			log.Printf("skipping %s — already exists or error: %v", c.Name, err)
			continue
		}
		log.Printf("created category: %s", c.Name)
	}

	log.Println("seed complete")
}
