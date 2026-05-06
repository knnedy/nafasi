-- name: GetAllCategories :many
SELECT * FROM "event_categories"
ORDER BY "name" ASC;

-- name: GetCategoryByID :one
SELECT * FROM "event_categories"
WHERE "id" = $1;

-- name: GetCategoryByName :one
SELECT * FROM "event_categories"
WHERE "name" = $1;

-- name: CreateCategory :one
INSERT INTO "event_categories" (
    "name",
    "description"
) VALUES (
    $1, $2
) RETURNING *;

-- name: UpdateCategory :one
UPDATE "event_categories"
SET
    "name"        = $2,
    "description" = $3,
    "updated_at"  = NOW()
WHERE "id" = $1
RETURNING *;

-- name: DeleteCategory :exec
DELETE FROM "event_categories"
WHERE "id" = $1;