-- Drop the old enum first and recreate with a temporary name
-- This migration will map ADMIN -> ZONE_MANAGER and DEALER -> FIELD_OFFICER

-- Create temporary enum with new values
ALTER TABLE `users` MODIFY COLUMN `role` ENUM('ZONE_MANAGER', 'FIELD_OFFICER') NOT NULL DEFAULT 'FIELD_OFFICER';

-- Update existing data
UPDATE `users` SET `role` = 'ZONE_MANAGER' WHERE `role` = 'ADMIN';
UPDATE `users` SET `role` = 'FIELD_OFFICER' WHERE `role` = 'DEALER';