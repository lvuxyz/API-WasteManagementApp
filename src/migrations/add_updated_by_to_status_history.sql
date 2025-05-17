-- Add updated_by column to collectionpointstatushistory table
ALTER TABLE collectionpointstatushistory
ADD COLUMN updated_by int NULL,
ADD FOREIGN KEY (updated_by) REFERENCES users(user_id);

-- Update existing records to set System as the updater
UPDATE collectionpointstatushistory
SET updated_by = NULL; 