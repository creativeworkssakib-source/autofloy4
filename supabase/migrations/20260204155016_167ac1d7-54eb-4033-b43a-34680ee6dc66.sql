-- Fix Security Definer View warnings by setting security_invoker = true
-- This ensures views respect RLS policies of the querying user

ALTER VIEW public.site_settings_public SET (security_invoker = true);
ALTER VIEW public.payment_methods_public SET (security_invoker = true);
ALTER VIEW public.reviews_public SET (security_invoker = true);
ALTER VIEW public.seo_settings_public SET (security_invoker = true);