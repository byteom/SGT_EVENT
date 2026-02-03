-- ============================================================
-- Migration: Add cancellation columns to event_registrations
-- For tracking registration cancellations and refunds
-- ============================================================

-- Add cancelled_at timestamp
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP DEFAULT NULL;

-- Add refund_status column
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20) DEFAULT NULL 
CHECK (refund_status IN ('PENDING', 'PROCESSED', 'FAILED', 'NOT_APPLICABLE'));

-- Add razorpay_refund_id for tracking refunds
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS razorpay_refund_id VARCHAR(100) DEFAULT NULL;

-- Add amount_paid to track original payment
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_registrations_cancelled_at 
ON event_registrations(cancelled_at) WHERE cancelled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_refund_status 
ON event_registrations(refund_status) WHERE refund_status IS NOT NULL;

-- Add comments
COMMENT ON COLUMN event_registrations.cancelled_at IS 'Timestamp when registration was cancelled';
COMMENT ON COLUMN event_registrations.refund_status IS 'Status of refund: PENDING, PROCESSED, FAILED, NOT_APPLICABLE';
COMMENT ON COLUMN event_registrations.razorpay_refund_id IS 'Razorpay refund ID for tracking';
COMMENT ON COLUMN event_registrations.amount_paid IS 'Original amount paid by student';

-- Verify migration
DO $$
BEGIN
    RAISE NOTICE 'Migration 016: Registration cancellation columns added successfully';
    RAISE NOTICE 'New columns: cancelled_at, refund_status, razorpay_refund_id, amount_paid';
END $$;
