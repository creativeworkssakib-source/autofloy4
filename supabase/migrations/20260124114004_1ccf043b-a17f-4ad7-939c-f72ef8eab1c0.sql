UPDATE page_memory 
SET automation_settings = jsonb_build_object(
  'autoInboxReply', true,
  'autoCommentReply', true,
  'orderTaking', true,
  'reactionOnComments', true,
  'aiMediaUnderstanding', true
)
WHERE page_id = '869208312950712';