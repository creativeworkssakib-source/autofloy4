-- Update platform descriptions to be user-friendly (no admin panel mentions)
UPDATE webhook_configs SET description = 'AI-powered auto-reply for Facebook Messenger & Page comments' WHERE id = 'facebook';
UPDATE webhook_configs SET description = 'AI-powered auto-reply for Instagram DMs' WHERE id = 'instagram';
UPDATE webhook_configs SET description = 'AI-powered auto-reply for WhatsApp Business' WHERE id = 'whatsapp';
UPDATE webhook_configs SET description = 'Automated responses for YouTube comments' WHERE id = 'youtube';
UPDATE webhook_configs SET description = 'Automated email notifications & reminders' WHERE id = 'email';
UPDATE webhook_configs SET description = 'Sync orders, products & inventory automatically' WHERE id = 'ecommerce';