// Environment variables interface
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  JWT_SECRET: string;
  FACEBOOK_APP_SECRET: string;
  LOVABLE_API_KEY: string;
  RESEND_API_KEY: string;
  TOKEN_ENCRYPTION_KEY: string;
}

// Common response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// AI Provider types
export type AIProvider = 'openai' | 'google' | 'lovable';

// Facebook webhook types
export interface FacebookWebhookEntry {
  id: string;
  time: number;
  messaging?: FacebookMessagingEvent[];
  changes?: FacebookChangeEvent[];
}

export interface FacebookMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: { url: string };
    }>;
  };
}

export interface FacebookChangeEvent {
  field: string;
  value: {
    item: string;
    verb: string;
    comment_id?: string;
    post_id?: string;
    message?: string;
    from?: { id: string; name: string };
  };
}

// Page Memory types
export interface PageMemory {
  id: string;
  user_id: string;
  page_id: string;
  page_name?: string;
  business_description?: string;
  products_summary?: string;
  preferred_tone?: string;
  custom_instructions?: string;
  selling_rules?: any;
  behavior_rules?: any;
  payment_rules?: any;
  delivery_rules?: any;
  is_ai_enabled?: boolean;
  auto_like_comments?: boolean;
  auto_reply_comments?: boolean;
  hide_negative_comments?: boolean;
}

// Conversation types
export interface AIConversation {
  id: string;
  page_id: string;
  sender_id: string;
  user_id: string;
  message_history: any[];
  conversation_state?: string;
  collected_name?: string;
  collected_phone?: string;
  collected_address?: string;
  current_product_id?: string;
  current_product_name?: string;
  current_product_price?: number;
  current_quantity?: number;
  total_messages_count?: number;
  last_message_at?: string;
}
