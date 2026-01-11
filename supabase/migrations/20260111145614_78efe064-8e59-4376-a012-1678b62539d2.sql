-- Refresh PostgREST schema cache by notifying
NOTIFY pgrst, 'reload schema';