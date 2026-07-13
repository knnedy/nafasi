-- name: CreateEvent :one
INSERT INTO "events" (
    "organiser_id",
    "category_id",
    "title",
    "slug",
    "description",
    "location",
    "venue",
    "banner_url",
    "starts_at",
    "ends_at",
    "status",
    "is_online",
    "online_url"
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
) RETURNING *;

-- name: GetEventById :one
SELECT * FROM "events" WHERE "id" = $1;

-- name: GetEventBySlug :one
SELECT * FROM "events" WHERE "slug" = $1;

-- name: UpdateEvent :one
UPDATE "events"
SET
    "category_id" = $2,
    "title"      = $3,
    "slug"       = $4,
    "description"= $5,
    "location"   = $6,
    "venue"      = $7,
    "banner_url" = $8,
    "starts_at"  = $9,
    "ends_at"    = $10,
    "is_online"  = $11,
    "online_url" = $12,
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;

-- name: DeleteEvent :one
UPDATE "events"
SET
    "status"     = 'DELETED',
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;