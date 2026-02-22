-- Migration: Add prediction_data column to questionnaire_responses table
-- Date: 2026-02-22
-- Description: Adds a JSONB column to store ML prediction results

-- Add prediction_data column if it doesn't exist
ALTER TABLE questionnaire_responses 
ADD COLUMN IF NOT EXISTS prediction_data JSONB;

-- Create index for prediction queries
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_prediction 
ON questionnaire_responses USING GIN (prediction_data);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'questionnaire_responses' 
AND column_name = 'prediction_data';
