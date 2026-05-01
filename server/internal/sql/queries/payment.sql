-- name: GetOrderByPaymentRef :one
SELECT * FROM "orders"
WHERE "payment_ref" = $1;

-- name: UpdateOrderStatus :one
UPDATE "orders"
SET
    "status"     = $2,
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;

-- name: UpdateOrderPayment :one
UPDATE "orders"
SET
    "status"         = $2,
    "payment_method" = $3,
    "payment_ref"    = $4,
    "updated_at"     = NOW()
WHERE "id" = $1
RETURNING *;

-- name: UpdateOrderQRCode :one
UPDATE "orders"
SET
    "qr_code"    = $2,
    "updated_at" = NOW()
WHERE "id" = $1
RETURNING *;