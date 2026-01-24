-- Enable Realtime for all remaining shop tables
-- This ensures ALL shop data updates in real-time across all devices

-- Add remaining shop tables to realtime publication
DO $$ 
BEGIN
  -- Shop Daily Cash Register
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shop_daily_cash_register'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shop_daily_cash_register;
  END IF;

  -- Shop Stock Adjustments  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shop_stock_adjustments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shop_stock_adjustments;
  END IF;

  -- Shop Returns
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shop_returns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shop_returns;
  END IF;

  -- Shop Loans
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shop_loans'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shop_loans;
  END IF;

  -- Shop Loan Payments
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shop_loan_payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shop_loan_payments;
  END IF;

  -- Shop Categories
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shop_categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shop_categories;
  END IF;

  -- Shop Cash Transactions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shop_cash_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shop_cash_transactions;
  END IF;

  -- Shop Quick Expenses
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shop_quick_expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shop_quick_expenses;
  END IF;

  -- Shop Supplier Returns
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shop_supplier_returns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shop_supplier_returns;
  END IF;

  -- Shop Suppliers
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shop_suppliers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shop_suppliers;
  END IF;

  -- Shop Trash
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shop_trash'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shop_trash;
  END IF;

  -- Shop Settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shop_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shop_settings;
  END IF;

END $$;