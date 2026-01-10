-- Remove duplicate/unnecessary webhook configs that are just variations of the same feature
-- Keep only the essential webhooks that actually serve a purpose

-- Delete redundant webhooks (keeping the main ones)
DELETE FROM webhook_configs WHERE id IN (
  'payment_failed',      -- Covered by 'payment' webhook
  'payment_success',     -- Covered by 'payment' webhook  
  'subscription_cancelled', -- Covered by 'subscription' webhook
  'subscription_created',   -- Covered by 'subscription' webhook
  'user_registered',     -- Covered by 'user_events' webhook
  'user_verified',       -- Covered by 'user_events' webhook
  'n8n_trigger',         -- Duplicate of 'automation_events'
  'website'              -- Coming soon, not needed yet
);

-- Update descriptions to be clearer
UPDATE webhook_configs SET 
  description = 'Facebook Messenger & Page automation. Admin panel থেকে URL add করলে সব automation এই URL ব্যবহার করবে।',
  is_coming_soon = false
WHERE id = 'facebook';

UPDATE webhook_configs SET 
  description = 'WhatsApp Business automation webhook - Admin panel থেকে configure করুন'
WHERE id = 'whatsapp';

UPDATE webhook_configs SET 
  description = 'Instagram DM automation webhook - Admin panel থেকে configure করুন'
WHERE id = 'instagram';

UPDATE webhook_configs SET 
  description = 'Email automation events - নতুন user, subscription changes, reminders'
WHERE id = 'email';

UPDATE webhook_configs SET 
  description = 'E-commerce orders, products, inventory updates'
WHERE id = 'ecommerce';

UPDATE webhook_configs SET 
  description = 'YouTube automation webhook'
WHERE id = 'youtube';

UPDATE webhook_configs SET 
  description = 'All user events: registration, verification, profile updates, login'
WHERE id = 'user_events';

UPDATE webhook_configs SET 
  description = 'Subscription lifecycle: created, updated, cancelled, plan changes, trial events'
WHERE id = 'subscription';

UPDATE webhook_configs SET 
  description = 'Payment events: success, failure, refunds'
WHERE id = 'payment';

UPDATE webhook_configs SET 
  description = 'Automation rule creation, updates, deletions, and execution logs'
WHERE id = 'automation_events';

UPDATE webhook_configs SET 
  description = 'Central webhook that receives ALL events - connect to n8n for full automation',
  name = 'Central n8n Webhook'
WHERE id = 'n8n_main';