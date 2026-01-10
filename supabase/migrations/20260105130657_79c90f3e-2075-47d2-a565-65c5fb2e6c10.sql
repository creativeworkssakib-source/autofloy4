-- Drop unused tables that are not used in the codebase

-- Drop invoices table (orders table already has all order info)
DROP TABLE IF EXISTS public.invoices;

-- Drop image_messages table (AI image processing not implemented)
DROP TABLE IF EXISTS public.image_messages;

-- Drop voice_messages table (voice message feature not implemented)
DROP TABLE IF EXISTS public.voice_messages;