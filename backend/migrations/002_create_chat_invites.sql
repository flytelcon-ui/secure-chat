CREATE TABLE IF NOT EXISTS chat_invites (
    id SERIAL PRIMARY KEY,
    token_hash CHAR(64) NOT NULL UNIQUE,
    inviter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS chat_invites_expires_at_idx ON chat_invites(expires_at);