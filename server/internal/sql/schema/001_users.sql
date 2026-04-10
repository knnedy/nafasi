-- +goose Up
CREATE TYPE user_role AS ENUM ('ATTENDEE', 'ORGANISER', 'ADMIN');

CREATE TABLE "users" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"          TEXT NOT NULL,
    "email"         TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role"          user_role NOT NULL DEFAULT 'ATTENDEE',
    "avatar_url"    TEXT,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at"    TIMESTAMP(3),
    CONSTRAINT "users_email_key" UNIQUE ("email")
);

-- +goose Down
DROP TABLE "users";
DROP TYPE user_role;