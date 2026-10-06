ALTER TABLE messages
ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS messages_unread_recipient_idx
ON messages (receiver_id, sender_id)
WHERE is_read = FALSE;