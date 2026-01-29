-- Create automations for existing connected Facebook pages
INSERT INTO automations (user_id, account_id, name, type, is_enabled, config)
SELECT 
  ca.user_id,
  ca.id,
  ca.name || ' - AI Auto Reply',
  'message'::automation_type,
  true,
  jsonb_build_object(
    'autoInboxReply', true,
    'autoCommentReply', true,
    'orderTaking', true,
    'reactionOnComments', true,
    'aiMediaUnderstanding', true
  )
FROM connected_accounts ca
WHERE ca.platform = 'facebook' 
  AND ca.user_id = '7871cd1a-4edc-4107-a989-ccbb5cb1d1d7'
  AND NOT EXISTS (
    SELECT 1 FROM automations a 
    WHERE a.account_id = ca.id AND a.type = 'message'
  );

-- Update connected_accounts to is_connected = true
UPDATE connected_accounts 
SET is_connected = true 
WHERE platform = 'facebook' 
  AND user_id = '7871cd1a-4edc-4107-a989-ccbb5cb1d1d7';

-- Update page_memory with default automation settings
UPDATE page_memory 
SET 
  automation_settings = jsonb_build_object(
    'autoInboxReply', true,
    'autoCommentReply', true,
    'orderTaking', true,
    'reactionOnComments', true,
    'aiMediaUnderstanding', true
  ),
  webhook_subscribed = true,
  updated_at = now()
WHERE user_id = '7871cd1a-4edc-4107-a989-ccbb5cb1d1d7';