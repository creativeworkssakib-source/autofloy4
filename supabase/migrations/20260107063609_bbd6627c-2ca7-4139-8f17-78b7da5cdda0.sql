-- Add n8n_main webhook which receives ALL events
INSERT INTO webhook_configs (id, name, description, url, category, icon, is_active, is_coming_soon)
VALUES ('n8n_main', 'n8n Main Webhook', 'Main webhook that receives ALL events from the system. Connect this to n8n for complete automation.', null, 'system', 'Webhook', false, false)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- Update n8n_trigger to system category and better description
UPDATE webhook_configs 
SET category = 'system',
    description = 'Triggered when automations are executed',
    name = 'Automation Events'
WHERE id = 'n8n_trigger';

-- Add user_events webhook for user-related events
INSERT INTO webhook_configs (id, name, description, url, category, icon, is_active, is_coming_soon)
VALUES ('user_events', 'User Events', 'Receives user registration, verification, and profile updates', null, 'system', 'UserPlus', false, false)
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description;

-- Add subscription webhook
INSERT INTO webhook_configs (id, name, description, url, category, icon, is_active, is_coming_soon)
VALUES ('subscription', 'Subscription Events', 'Receives subscription created, updated, cancelled, and plan change events', null, 'system', 'CreditCard', false, false)
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description;

-- Add payment webhook
INSERT INTO webhook_configs (id, name, description, url, category, icon, is_active, is_coming_soon)
VALUES ('payment', 'Payment Events', 'Receives payment success and failure events', null, 'system', 'CreditCard', false, false)
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description;

-- Add automation_events webhook
INSERT INTO webhook_configs (id, name, description, url, category, icon, is_active, is_coming_soon)
VALUES ('automation_events', 'Automation Execution', 'Receives automation rule creation, updates, and execution events', null, 'system', 'Settings2', false, false)
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description;