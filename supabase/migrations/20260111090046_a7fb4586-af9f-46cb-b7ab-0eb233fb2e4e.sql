-- Add missing columns to shop_trash table for soft delete tracking
ALTER TABLE public.shop_trash
  ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS permanently_deleted_at TIMESTAMP WITH TIME ZONE;