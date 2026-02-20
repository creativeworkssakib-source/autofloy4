-- Enable automation for user
UPDATE user_usage_limits 
SET is_automation_enabled = true, updated_at = now()
WHERE user_id = '7871cd1a-4edc-4107-a989-ccbb5cb1d1d7';

-- Enable admin AI for user (uses global Google Gemini API key)
UPDATE ai_provider_settings 
SET use_admin_ai = true, is_active = true, updated_at = now()
WHERE user_id = '7871cd1a-4edc-4107-a989-ccbb5cb1d1d7';