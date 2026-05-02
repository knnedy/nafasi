-- name: CreateUser :one
INSERT INTO "users" (
    "name",
    "email",
    "password",
    "role",
    "is_verified"
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;

-- name: GetUserById :one
SELECT * FROM "users" WHERE "id" = $1;

-- name: GetUserByEmail :one
SELECT * FROM "users" WHERE "email" = $1;

-- name: UpdateUserProfile :one
UPDATE "users"
SET
    "name"       = $2,
    "email"      = $3,
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;

-- name: UpdateUserPassword :one
UPDATE "users"
SET
    "password"   = $2,
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;

-- name: UpdateUserAvatar :one
UPDATE "users"
SET
    "avatar_url" = $2,
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;

-- name: DeleteUser :one
UPDATE "users"
SET
    "status"     = 'DELETED',
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;