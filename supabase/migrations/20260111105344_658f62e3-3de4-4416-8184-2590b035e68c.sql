-- Add unique constraint on user_id for proper upsert
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);

-- Also add plan column to accept text values for the plan names from payment_requests
-- First check if we need to update the enum
DO $$ 
BEGIN
    -- Add missing plan values to the enum if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'starter' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan_type')) THEN
        ALTER TYPE subscription_plan_type ADD VALUE IF NOT EXISTS 'starter';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'professional' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan_type')) THEN
        ALTER TYPE subscription_plan_type ADD VALUE IF NOT EXISTS 'professional';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'business' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan_type')) THEN
        ALTER TYPE subscription_plan_type ADD VALUE IF NOT EXISTS 'business';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'lifetime' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan_type')) THEN
        ALTER TYPE subscription_plan_type ADD VALUE IF NOT EXISTS 'lifetime';
    END IF;
END $$;