-- Enable realtime for all key shop tables
-- This allows automatic live updates across all connected devices

ALTER PUBLICATION supabase_realtime ADD TABLE shop_products;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_sales;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_customers;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_suppliers;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_loans;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_stock_adjustments;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_daily_cash_register;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_returns;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_trash;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE automations;
ALTER PUBLICATION supabase_realtime ADD TABLE execution_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE connected_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;