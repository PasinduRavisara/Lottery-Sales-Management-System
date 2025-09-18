-- Migration to reorder timestamp columns to be last in both tables
-- This ensures created_at and updated_at are always the final columns

-- First, backup the current tables structure (for safety)
-- SHOW CREATE TABLE sales_submissions;
-- SHOW CREATE TABLE daily_sales;

-- Reorder sales_submissions table columns
-- Move created_at and updated_at to the end
ALTER TABLE sales_submissions 
MODIFY COLUMN total_tickets INT NOT NULL AFTER is_draft,
MODIFY COLUMN created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER total_tickets,
MODIFY COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) AFTER created_at;

-- Reorder daily_sales table columns  
-- Move created_at and updated_at to the end
ALTER TABLE daily_sales
MODIFY COLUMN weekly_total INT NOT NULL AFTER sunday,
MODIFY COLUMN created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER weekly_total,
MODIFY COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) AFTER created_at;

-- Verify the new column order
SELECT 
    'sales_submissions' as table_name,
    COLUMN_NAME,
    ORDINAL_POSITION,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'sales_submissions'
ORDER BY ORDINAL_POSITION;

SELECT 
    'daily_sales' as table_name,
    COLUMN_NAME,
    ORDINAL_POSITION,
    DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'daily_sales'
ORDER BY ORDINAL_POSITION;