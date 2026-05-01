-- name: AdminGetAllUsers :many
SELECT * FROM "users"
ORDER BY "created_at" DESC
LIMIT $1 OFFSET $2;

-- name: GetUsersByRole :many
SELECT * FROM "users"
WHERE "role" = $1
ORDER BY "created_at" DESC
LIMIT $2 OFFSET $3;

-- name: AdminGetPendingOrganisers :many
SELECT * FROM "users"
WHERE "role" = 'ORGANISER'
AND "is_verified" = FALSE
ORDER BY "created_at" ASC;

-- name: AdminGetApprovedOrganisers :many
SELECT * FROM "users"
WHERE "role" = 'ORGANISER'
AND "is_verified" = TRUE
AND "status" = 'ACTIVE'
ORDER BY "created_at" DESC;

-- name: AdminGetBannedUsers :many
SELECT * FROM "users"
WHERE "is_banned" = TRUE
ORDER BY "banned_at" DESC;

-- name: AdminUpdateUserVerification :one
UPDATE "users"
SET
    "is_verified" = $2,
    "updated_at"  = NOW()
WHERE "id" = $1
RETURNING *;

-- name: AdminBanUser :one
UPDATE "users"
SET
    "status"  = 'BANNED',
    "banned_at"  = NOW(),
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;

-- name: AdminUnbanUser :one
UPDATE "users"
SET
    "status"  = 'ACTIVE',
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

-- name: AdminDeleteUser :exec
UPDATE "users"
SET
    "status"     = 'DELETED',
    "updated_at" = NOW()
WHERE "id" = $1;