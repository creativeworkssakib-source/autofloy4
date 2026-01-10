-- Fix orphaned shop_sales with NULL shop_id by assigning to user's default shop
UPDATE shop_sales ss
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = ss.user_id 
  AND s.is_active = true 
  ORDER BY s.is_default DESC, s.created_at ASC 
  LIMIT 1
)
WHERE ss.shop_id IS NULL;

-- Fix orphaned shop_sale_items with NULL shop_id (if the column exists)
-- Note: shop_sale_items may not have shop_id column, so we skip this

-- Fix orphaned shop_cash_transactions with NULL shop_id
UPDATE shop_cash_transactions sct
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = sct.user_id 
  AND s.is_active = true 
  ORDER BY s.is_default DESC, s.created_at ASC 
  LIMIT 1
)
WHERE sct.shop_id IS NULL;

-- Fix orphaned shop_products with NULL shop_id
UPDATE shop_products sp
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = sp.user_id 
  AND s.is_active = true 
  ORDER BY s.is_default DESC, s.created_at ASC 
  LIMIT 1
)
WHERE sp.shop_id IS NULL;

-- Fix orphaned shop_customers with NULL shop_id
UPDATE shop_customers sc
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = sc.user_id 
  AND s.is_active = true 
  ORDER BY s.is_default DESC, s.created_at ASC 
  LIMIT 1
)
WHERE sc.shop_id IS NULL;

-- Fix orphaned shop_suppliers with NULL shop_id
UPDATE shop_suppliers ss
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = ss.user_id 
  AND s.is_active = true 
  ORDER BY s.is_default DESC, s.created_at ASC 
  LIMIT 1
)
WHERE ss.shop_id IS NULL;

-- Fix orphaned shop_purchases with NULL shop_id
UPDATE shop_purchases sp
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = sp.user_id 
  AND s.is_active = true 
  ORDER BY s.is_default DESC, s.created_at ASC 
  LIMIT 1
)
WHERE sp.shop_id IS NULL;

-- Fix orphaned shop_expenses with NULL shop_id
UPDATE shop_expenses se
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = se.user_id 
  AND s.is_active = true 
  ORDER BY s.is_default DESC, s.created_at ASC 
  LIMIT 1
)
WHERE se.shop_id IS NULL;

-- Fix orphaned shop_returns with NULL shop_id
UPDATE shop_returns sr
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = sr.user_id 
  AND s.is_active = true 
  ORDER BY s.is_default DESC, s.created_at ASC 
  LIMIT 1
)
WHERE sr.shop_id IS NULL;

-- Fix orphaned shop_damages with NULL shop_id
UPDATE shop_damages sd
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = sd.user_id 
  AND s.is_active = true 
  ORDER BY s.is_default DESC, s.created_at ASC 
  LIMIT 1
)
WHERE sd.shop_id IS NULL;

-- Fix orphaned shop_categories with NULL shop_id
UPDATE shop_categories sc
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = sc.user_id 
  AND s.is_active = true 
  ORDER BY s.is_default DESC, s.created_at ASC 
  LIMIT 1
)
WHERE sc.shop_id IS NULL;

-- Fix orphaned shop_stock_adjustments with NULL shop_id
UPDATE shop_stock_adjustments ssa
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = ssa.user_id 
  AND s.is_active = true 
  ORDER BY s.is_default DESC, s.created_at ASC 
  LIMIT 1
)
WHERE ssa.shop_id IS NULL;