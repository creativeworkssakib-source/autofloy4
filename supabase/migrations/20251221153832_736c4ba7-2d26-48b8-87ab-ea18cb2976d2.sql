-- Clear rate limit locks for the admin user
DELETE FROM auth_rate_limits 
WHERE identifier = 'creativeworkssakib@gmail.com';