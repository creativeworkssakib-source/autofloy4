-- Add AI Behavior Configuration columns to page_memory table
ALTER TABLE public.page_memory
ADD COLUMN IF NOT EXISTS selling_rules JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_behavior_rules JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_rules JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.page_memory.selling_rules IS 'AI selling rules: usePriceFromProduct, allowDiscount, maxDiscountPercent, allowLowProfitSale';
COMMENT ON COLUMN public.page_memory.ai_behavior_rules IS 'AI behavior rules: neverHallucinate, askClarificationIfUnsure, askForClearerPhotoIfNeeded, confirmBeforeOrder';
COMMENT ON COLUMN public.page_memory.payment_rules IS 'Payment rules: codAvailable, advanceRequiredAbove, advancePercentage';