-- +goose Up
CREATE TYPE user_status AS ENUM ('ACTIVE', 'BANNED', 'DELETED');
CREATE TYPE user_role AS ENUM ('ATTENDEE', 'ORGANISER', 'ADMIN');

CREATE TABLE "users" (
    "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name"        TEXT NOT NULL,
    "email"       TEXT NOT NULL,
    "password"    TEXT NOT NULL,
    "role"        user_role NOT NULL DEFAULT 'ATTENDEE',
    "is_verified" BOOLEAN NOT NULL DEFAULT FALSE,
    "status"      user_status NOT NULL DEFAULT 'ACTIVE',
    "avatar_url"  TEXT,
    "banned_at"   TIMESTAMP(3),
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "users_email_key" UNIQUE ("email")
);

-- +goose Down
DROP TABLE "users";
DROP TYPE user_role;
DROP TYPE user_status;