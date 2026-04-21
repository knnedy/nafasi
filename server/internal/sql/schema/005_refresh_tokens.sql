-- +goose Up
CREATE TABLE "refresh_tokens" (
    "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"    UUID NOT NULL,
    "token"      TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "revoked_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "refresh_tokens_token_key" UNIQUE ("token"),
    CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens"("user_id");
CREATE INDEX "idx_refresh_tokens_token" ON "refresh_tokens"("token");

-- +goose Down
DROP INDEX "idx_refresh_tokens_token";
DROP INDEX "idx_refresh_tokens_user_id";
DROP TABLE "refresh_tokens";