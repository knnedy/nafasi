include .env
export

# variables
BINARY_NAME=api
MAIN_PATH=./cmd/api
DB_URL=$(DATABASE_URL)
SWAG_MAIN=./cmd/api/main.go
SWAG_OUT=./docs

# build
build:
	go build -o bin/$(BINARY_NAME) $(MAIN_PATH)

# run
run:
	go run $(MAIN_PATH)

# dev
dev: 
	air

# test
test:
	go test ./... -v

# test with coverage
test-coverage:
	go test ./... -coverprofile=coverage.out
	go tool cover -html=coverage.out

# lint
lint:
	golangci-lint run ./...

# migrations
migrate-up:
	goose -dir ./internal/sql/schema postgres "$(DB_URL)" up

migrate-down:
	goose -dir ./internal/sql/schema postgres "$(DB_URL)" down

migrate-reset:
	goose -dir ./internal/sql/schema postgres "$(DB_URL)" reset

migrate-status:
	goose -dir ./internal/sql/schema postgres "$(DB_URL)" status

migrate-create:
	goose -dir ./internal/sql/schema create $(name) sql


# swagger
swagger:
	swag init -g $(MAIN_PATH)/main.go -o ./docs
