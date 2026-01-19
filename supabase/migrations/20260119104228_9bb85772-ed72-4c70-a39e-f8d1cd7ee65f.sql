-- Delete orphaned cash transactions for today that reference the old purchase
DELETE FROM shop_cash_transactions 
WHERE shop_id = 'cd81a5a4-c3d5-4406-9259-f9bac4e9224e' 
AND source = 'supplier_payment'
AND type = 'out' 
AND reference_id = '01fd7704-ac35-411f-9213-224de31edb95'
AND transaction_date >= CURRENT_DATE;