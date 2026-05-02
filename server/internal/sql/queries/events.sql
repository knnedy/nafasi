-- name: CreateEvent :one
INSERT INTO "events" (
    "organiser_id",
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
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
) RETURNING *;

-- name: GetEventById :one
SELECT * FROM "events" WHERE "id" = $1;

-- name: GetEventBySlug :one
SELECT * FROM "events" WHERE "slug" = $1;

-- name: UpdateEvent :one
UPDATE "events"
SET
    "title"      = $2,
    "slug"       = $3,
    "description"= $4,
    "location"   = $5,
    "venue"      = $6,
    "banner_url" = $7,
    "starts_at"  = $8,
    "ends_at"    = $9,
    "is_online"  = $10,
    "online_url" = $11,
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;

-- name: CancelEvent :one
UPDATE "events"
SET
    "status"     = 'CANCELLED',
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