-- name: PublicGetPublishedEvents :many
SELECT * FROM "events"
WHERE "status" = 'PUBLISHED'
ORDER BY "starts_at" ASC;

-- name: PublicGetUpcomingEvents :many
SELECT * FROM "events"
WHERE "status" = 'PUBLISHED'
AND "starts_at" > NOW()
ORDER BY "starts_at" ASC;
