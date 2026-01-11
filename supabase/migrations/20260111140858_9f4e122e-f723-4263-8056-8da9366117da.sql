-- Add invoice settings columns to shop_settings table
ALTER TABLE shop_settings 
ADD COLUMN IF NOT EXISTS branch_name TEXT,
ADD COLUMN IF NOT EXISTS receipt_size TEXT DEFAULT '80mm', -- '80mm', '58mm', 'a4'
ADD COLUMN IF NOT EXISTS receipt_font_size TEXT DEFAULT 'small', -- 'small', 'medium', 'large'
ADD COLUMN IF NOT EXISTS show_logo_on_receipt BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS thank_you_message TEXT DEFAULT 'Thank you for shopping with us!',
ADD COLUMN IF NOT EXISTS show_tax_on_receipt BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_payment_method BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS receipt_header_text TEXT,
ADD COLUMN IF NOT EXISTS receipt_footer_text TEXT;