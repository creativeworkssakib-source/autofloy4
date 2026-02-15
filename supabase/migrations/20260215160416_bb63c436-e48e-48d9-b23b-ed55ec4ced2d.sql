-- Reset the existing activation code to allow more uses
UPDATE admin_activation_codes 
SET max_uses = 10, current_uses = 0 
WHERE code = 'AF-DW5EMWDK';

-- Also insert a fresh new code for admin use
INSERT INTO admin_activation_codes (code, max_uses, daily_message_limit, daily_comment_limit, monthly_total_limit, is_active, created_by)
SELECT 'AF-NEWAI2026', 50, 100, 100, 5000, true, id 
FROM users 
WHERE email IN (SELECT email FROM users ORDER BY created_at ASC LIMIT 1)
ON CONFLICT DO NOTHING;