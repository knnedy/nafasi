-- name: GetAllUsers :many
SELECT * FROM "users"
ORDER BY "created_at" DESC
LIMIT $1 OFFSET $2;

-- name: GetUsersByRole :many
SELECT * FROM "users"
WHERE "role" = $1
ORDER BY "created_at" DESC
LIMIT $2 OFFSET $3;

-- name: GetApprovedOrganisers :many
SELECT * FROM "users"
WHERE "role" = 'ORGANISER'
AND "is_verified" = TRUE
AND "is_banned" = FALSE
ORDER BY "created_at" DESC;

-- name: GetBannedUsers :many
SELECT * FROM "users"
WHERE "is_banned" = TRUE
ORDER BY "banned_at" DESC;

-- name: BanUser :one
UPDATE "users"
SET
    "is_banned"  = TRUE,
    "ban_reason" = $2,
    "banned_at"  = NOW(),
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;

-- name: UnbanUser :one
UPDATE "users"
SET
    "is_banned"  = FALSE,
    "ban_reason" = NULL,
    "banned_at"  = NULL,
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;

-- name: PromoteToAdmin :one
UPDATE "users"
SET
    "role"       = 'ADMIN',
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;