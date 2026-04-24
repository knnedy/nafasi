-- +goose Up
CREATE TABLE "password_reset_tokens" (
    "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"    UUID NOT NULL,
    "token"      TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at"    TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "password_reset_tokens_token_key" UNIQUE ("token"),
    CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_password_reset_tokens_token" ON "password_reset_tokens"("token");
CREATE INDEX "idx_password_reset_tokens_user_id" ON "password_reset_tokens"("user_id");

-- +goose Down
DROP INDEX "idx_password_reset_tokens_token";
DROP INDEX "idx_password_reset_tokens_user_id";
DROP TABLE "password_reset_tokens";