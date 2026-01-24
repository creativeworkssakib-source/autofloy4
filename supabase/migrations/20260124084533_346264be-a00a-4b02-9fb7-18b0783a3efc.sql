-- Update page_memory with automation settings enabled
UPDATE page_memory 
SET 
  automation_settings = '{"autoInboxReply": true, "autoCommentReply": true, "orderTaking": true, "reactionOnComments": true, "aiMediaUnderstanding": true}'::jsonb,
  business_description = 'We are a Business Automation company providing AI-powered solutions for Facebook businesses. We help businesses automate their customer interactions.',
  updated_at = NOW()
WHERE page_id = '869208312950712';