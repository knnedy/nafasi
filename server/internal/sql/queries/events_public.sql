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
