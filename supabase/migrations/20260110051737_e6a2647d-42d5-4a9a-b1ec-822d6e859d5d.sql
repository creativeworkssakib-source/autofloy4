-- Fix: Create missing shops for users who don't have any
INSERT INTO shops (user_id, name, is_active)
SELECT u.id, COALESCE(u.display_name || '''s Shop', 'My Shop'), true
FROM users u
LEFT JOIN shops s ON u.id = s.user_id
WHERE s.id IS NULL;

-- Now fix orphaned data by assigning to user's first shop

-- Fix products with NULL shop_id
UPDATE shop_products p
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = p.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE p.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = p.user_id AND s.is_active = true
  );

-- Fix suppliers with NULL shop_id
UPDATE shop_suppliers sp
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = sp.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE sp.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = sp.user_id AND s.is_active = true
  );

-- Fix sales with NULL shop_id
UPDATE shop_sales ss
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = ss.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE ss.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = ss.user_id AND s.is_active = true
  );

-- Fix purchases with NULL shop_id
UPDATE shop_purchases sp
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = sp.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE sp.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = sp.user_id AND s.is_active = true
  );

-- Fix categories with NULL shop_id
UPDATE shop_categories sc
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = sc.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE sc.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = sc.user_id AND s.is_active = true
  );

-- Fix cash_transactions with NULL shop_id
UPDATE shop_cash_transactions sct
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = sct.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE sct.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = sct.user_id AND s.is_active = true
  );

-- Fix supplier_payments with NULL shop_id
UPDATE shop_supplier_payments ssp
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = ssp.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE ssp.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = ssp.user_id AND s.is_active = true
  );

-- Fix settings with NULL shop_id
UPDATE shop_settings ss
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = ss.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE ss.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = ss.user_id AND s.is_active = true
  );

-- Delete orphan product_categories (online products) that don't have valid users
DELETE FROM product_categories
WHERE user_id NOT IN (SELECT id FROM users);