-- Add email sent timestamp to track when emails were sent
ALTER TABLE bydaya_event_invitees 
ADD COLUMN IF NOT EXISTS mail_sent_at TIMESTAMP;