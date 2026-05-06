-- name: PublicGetPublishedEvents :many
SELECT * FROM "events"
WHERE "status" = 'PUBLISHED'
ORDER BY starts_at DESC
LIMIT $1 OFFSET $2;

-- name: PublicGetUpcomingEvents :many
SELECT * FROM "events"
WHERE "status" = 'PUBLISHED'
AND "starts_at" > NOW()
ORDER BY "starts_at" ASC
LIMIT $1 OFFSET $2;

-- name: GetPublishedEventsByCategory :many
SELECT * FROM "events"
WHERE "category_id" = $1
AND "status" = 'PUBLISHED'
ORDER BY "starts_at" DESC
LIMIT $2 OFFSET $3;

-- name: GetUpcomingEventsByCategory :many
SELECT * FROM "events"
WHERE "category_id" = $1
AND "status" = 'PUBLISHED'
AND "starts_at" > NOW()
ORDER BY "starts_at" ASC
LIMIT $2 OFFSET $3;