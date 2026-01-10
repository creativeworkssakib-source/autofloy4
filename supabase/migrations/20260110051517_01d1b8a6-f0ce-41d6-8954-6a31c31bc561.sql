-- Fix orphaned products with NULL shop_id by assigning them to user's first shop
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

-- Fix customers
UPDATE shop_customers c
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = c.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE c.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = c.user_id AND s.is_active = true
  );

-- Fix suppliers
UPDATE shop_suppliers c
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = c.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE c.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = c.user_id AND s.is_active = true
  );

-- Fix sales
UPDATE shop_sales c
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = c.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE c.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = c.user_id AND s.is_active = true
  );

-- Fix purchases
UPDATE shop_purchases c
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = c.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE c.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = c.user_id AND s.is_active = true
  );

-- Fix expenses
UPDATE shop_expenses c
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = c.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE c.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = c.user_id AND s.is_active = true
  );

-- Fix returns
UPDATE shop_returns c
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = c.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE c.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = c.user_id AND s.is_active = true
  );

-- Fix cash transactions
UPDATE shop_cash_transactions c
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = c.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE c.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = c.user_id AND s.is_active = true
  );

-- Fix categories
UPDATE shop_categories c
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = c.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE c.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = c.user_id AND s.is_active = true
  );

-- Fix damages
UPDATE shop_damages c
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = c.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE c.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = c.user_id AND s.is_active = true
  );

-- Fix settings
UPDATE shop_settings c
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = c.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE c.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = c.user_id AND s.is_active = true
  );

-- Fix staff users
UPDATE shop_staff_users c
SET shop_id = (
  SELECT s.id 
  FROM shops s 
  WHERE s.user_id = c.user_id 
    AND s.is_active = true 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE c.shop_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.user_id = c.user_id AND s.is_active = true
  );