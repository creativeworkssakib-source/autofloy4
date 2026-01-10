-- Insert admin role for creativeworkssakib@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.users 
WHERE email = 'creativeworkssakib@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::app_role;