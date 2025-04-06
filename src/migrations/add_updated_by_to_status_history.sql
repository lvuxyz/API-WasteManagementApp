-- Add updated_by column to CollectionPointStatusHistory table
ALTER TABLE CollectionPointStatusHistory
ADD COLUMN updated_by int NULL,
ADD FOREIGN KEY (updated_by) REFERENCES Users(user_id);

-- Update existing records to set System as the updater
UPDATE CollectionPointStatusHistory
SET updated_by = NULL; 