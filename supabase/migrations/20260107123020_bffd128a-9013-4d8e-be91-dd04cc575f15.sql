-- Enable Facebook and WhatsApp automations for users (not coming soon anymore)
UPDATE webhook_configs 
SET is_active = true, is_coming_soon = false 
WHERE id IN ('facebook', 'whatsapp');

-- Keep other platforms as coming soon for now (Instagram, YouTube, Email, E-commerce)
UPDATE webhook_configs 
SET is_coming_soon = true, is_active = false 
WHERE id IN ('instagram', 'youtube', 'email', 'ecommerce');