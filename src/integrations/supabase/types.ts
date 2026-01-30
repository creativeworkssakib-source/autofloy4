export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_deletion_otps: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_hash: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_hash: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "account_deletion_otps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          collected_address: string | null
          collected_name: string | null
          collected_phone: string | null
          conversation_state: string | null
          created_at: string
          current_product_id: string | null
          current_product_name: string | null
          current_product_price: number | null
          current_quantity: number | null
          customer_preferences: Json | null
          customer_summary: string | null
          fake_order_score: number | null
          has_ordered_before: boolean | null
          id: string
          last_message_at: string | null
          last_products_discussed: string[] | null
          message_history: Json | null
          page_id: string
          sender_id: string
          sender_name: string | null
          total_messages_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          collected_address?: string | null
          collected_name?: string | null
          collected_phone?: string | null
          conversation_state?: string | null
          created_at?: string
          current_product_id?: string | null
          current_product_name?: string | null
          current_product_price?: number | null
          current_quantity?: number | null
          customer_preferences?: Json | null
          customer_summary?: string | null
          fake_order_score?: number | null
          has_ordered_before?: boolean | null
          id?: string
          last_message_at?: string | null
          last_products_discussed?: string[] | null
          message_history?: Json | null
          page_id: string
          sender_id: string
          sender_name?: string | null
          total_messages_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          collected_address?: string | null
          collected_name?: string | null
          collected_phone?: string | null
          conversation_state?: string | null
          created_at?: string
          current_product_id?: string | null
          current_product_name?: string | null
          current_product_price?: number | null
          current_quantity?: number | null
          customer_preferences?: Json | null
          customer_summary?: string | null
          fake_order_score?: number | null
          has_ordered_before?: boolean | null
          id?: string
          last_message_at?: string | null
          last_products_discussed?: string[] | null
          message_history?: Json | null
          page_id?: string
          sender_id?: string
          sender_name?: string | null
          total_messages_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_message_buffer: {
        Row: {
          created_at: string
          first_message_at: string
          id: string
          is_processed: boolean | null
          last_message_at: string
          messages: Json
          page_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          first_message_at?: string
          id?: string
          is_processed?: boolean | null
          last_message_at?: string
          messages?: Json
          page_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          first_message_at?: string
          id?: string
          is_processed?: boolean | null
          last_message_at?: string
          messages?: Json
          page_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      ai_orders: {
        Row: {
          advance_amount: number | null
          conversation_id: string | null
          created_at: string
          customer_address: string
          customer_fb_id: string
          customer_name: string
          customer_phone: string
          delivery_charge: number | null
          fake_order_score: number | null
          id: string
          invoice_number: string | null
          notes: string | null
          order_status: string | null
          page_id: string
          payment_method: string | null
          products: Json
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          advance_amount?: number | null
          conversation_id?: string | null
          created_at?: string
          customer_address: string
          customer_fb_id: string
          customer_name: string
          customer_phone: string
          delivery_charge?: number | null
          fake_order_score?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          order_status?: string | null
          page_id: string
          payment_method?: string | null
          products?: Json
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          advance_amount?: number | null
          conversation_id?: string | null
          created_at?: string
          customer_address?: string
          customer_fb_id?: string
          customer_name?: string
          customer_phone?: string
          delivery_charge?: number | null
          fake_order_score?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          order_status?: string | null
          page_id?: string
          payment_method?: string | null
          products?: Json
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_orders_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_integrations: {
        Row: {
          api_key: string | null
          api_secret: string | null
          config: Json | null
          created_at: string
          id: string
          is_enabled: boolean | null
          provider: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          provider: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          config?: Json | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      appearance_settings: {
        Row: {
          accent_color: string | null
          body_font: string | null
          created_at: string | null
          custom_css: string | null
          destructive_color: string | null
          heading_font: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          hero_title_bn: string | null
          id: string
          primary_color: string | null
          secondary_color: string | null
          success_color: string | null
          updated_at: string | null
          warning_color: string | null
        }
        Insert: {
          accent_color?: string | null
          body_font?: string | null
          created_at?: string | null
          custom_css?: string | null
          destructive_color?: string | null
          heading_font?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          hero_title_bn?: string | null
          id?: string
          primary_color?: string | null
          secondary_color?: string | null
          success_color?: string | null
          updated_at?: string | null
          warning_color?: string | null
        }
        Update: {
          accent_color?: string | null
          body_font?: string | null
          created_at?: string | null
          custom_css?: string | null
          destructive_color?: string | null
          heading_font?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          hero_title_bn?: string | null
          id?: string
          primary_color?: string | null
          secondary_color?: string | null
          success_color?: string | null
          updated_at?: string | null
          warning_color?: string | null
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          locked_until: string | null
          window_start: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          locked_until?: string | null
          window_start?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          locked_until?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      automations: {
        Row: {
          account_id: string
          config: Json | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          name: string
          response_template: string | null
          trigger_keywords: string[] | null
          type: Database["public"]["Enums"]["automation_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          config?: Json | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          response_template?: string | null
          trigger_keywords?: string[] | null
          type: Database["public"]["Enums"]["automation_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          config?: Json | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          response_template?: string | null
          trigger_keywords?: string[] | null
          type?: Database["public"]["Enums"]["automation_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string | null
          canonical_url: string | null
          category: string | null
          content: string | null
          content_bn: string | null
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          read_time_minutes: number | null
          slug: string
          tags: string[] | null
          title: string
          title_bn: string | null
          updated_at: string | null
        }
        Insert: {
          author_name?: string | null
          canonical_url?: string | null
          category?: string | null
          content?: string | null
          content_bn?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time_minutes?: number | null
          slug: string
          tags?: string[] | null
          title: string
          title_bn?: string | null
          updated_at?: string | null
        }
        Update: {
          author_name?: string | null
          canonical_url?: string | null
          category?: string | null
          content?: string | null
          content_bn?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time_minutes?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          title_bn?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          canonical_url: string | null
          content: string | null
          content_bn: string | null
          created_at: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          title: string
          title_bn: string | null
          updated_at: string | null
        }
        Insert: {
          canonical_url?: string | null
          content?: string | null
          content_bn?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          title: string
          title_bn?: string | null
          updated_at?: string | null
        }
        Update: {
          canonical_url?: string | null
          content?: string | null
          content_bn?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          title_bn?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      connected_accounts: {
        Row: {
          access_token: string
          access_token_encrypted: string | null
          category: string | null
          created_at: string | null
          encryption_version: number | null
          expires_at: string | null
          external_id: string
          id: string
          is_connected: boolean | null
          name: string | null
          picture_url: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          refresh_token: string | null
          refresh_token_encrypted: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          access_token_encrypted?: string | null
          category?: string | null
          created_at?: string | null
          encryption_version?: number | null
          expires_at?: string | null
          external_id: string
          id?: string
          is_connected?: boolean | null
          name?: string | null
          picture_url?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          refresh_token?: string | null
          refresh_token_encrypted?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          access_token_encrypted?: string | null
          category?: string | null
          created_at?: string | null
          encryption_version?: number | null
          expires_at?: string | null
          external_id?: string
          id?: string
          is_connected?: boolean | null
          name?: string | null
          picture_url?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          refresh_token?: string | null
          refresh_token_encrypted?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connected_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_followups: {
        Row: {
          conversation_summary: string | null
          created_at: string
          customer_fb_id: string
          customer_name: string | null
          customer_phone: string | null
          followup_count: number | null
          has_purchased: boolean | null
          id: string
          last_followup_at: string | null
          last_followup_message: string | null
          last_message_at: string | null
          last_products_discussed: string[] | null
          platform: string
          status: string | null
          total_messages: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_summary?: string | null
          created_at?: string
          customer_fb_id: string
          customer_name?: string | null
          customer_phone?: string | null
          followup_count?: number | null
          has_purchased?: boolean | null
          id?: string
          last_followup_at?: string | null
          last_followup_message?: string | null
          last_message_at?: string | null
          last_products_discussed?: string[] | null
          platform?: string
          status?: string | null
          total_messages?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_summary?: string | null
          created_at?: string
          customer_fb_id?: string
          customer_name?: string | null
          customer_phone?: string | null
          followup_count?: number | null
          has_purchased?: boolean | null
          id?: string
          last_followup_at?: string | null
          last_followup_message?: string | null
          last_message_at?: string | null
          last_products_discussed?: string[] | null
          platform?: string
          status?: string | null
          total_messages?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      digital_product_sales: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_fb_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          delivery_status: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          product_id: string
          sale_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_fb_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          product_id: string
          sale_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_fb_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_status?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          product_id?: string
          sale_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_product_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_products: {
        Row: {
          access_instructions: string | null
          access_url: string | null
          api_documentation: string | null
          api_endpoint: string | null
          api_key: string | null
          created_at: string
          credential_email: string | null
          credential_extra: Json | null
          credential_password: string | null
          credential_username: string | null
          currency: string | null
          description: string | null
          file_name: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          is_unlimited_stock: boolean | null
          name: string
          price: number
          product_type: string
          sale_price: number | null
          shop_id: string | null
          stock_quantity: number | null
          total_sold: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_instructions?: string | null
          access_url?: string | null
          api_documentation?: string | null
          api_endpoint?: string | null
          api_key?: string | null
          created_at?: string
          credential_email?: string | null
          credential_extra?: Json | null
          credential_password?: string | null
          credential_username?: string | null
          currency?: string | null
          description?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          is_unlimited_stock?: boolean | null
          name: string
          price?: number
          product_type?: string
          sale_price?: number | null
          shop_id?: string | null
          stock_quantity?: number | null
          total_sold?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_instructions?: string | null
          access_url?: string | null
          api_documentation?: string | null
          api_endpoint?: string | null
          api_key?: string | null
          created_at?: string
          credential_email?: string | null
          credential_extra?: Json | null
          credential_password?: string | null
          credential_username?: string | null
          currency?: string | null
          description?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          is_unlimited_stock?: boolean | null
          name?: string
          price?: number
          product_type?: string
          sale_price?: number | null
          shop_id?: string | null
          stock_quantity?: number | null
          total_sold?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          subject_bn: string | null
          text_content: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          html_content: string
          id: string
          is_active?: boolean | null
          name: string
          subject: string
          subject_bn?: string | null
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          subject_bn?: string | null
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      email_usage_history: {
        Row: {
          created_at: string
          email: string
          first_signup_at: string
          id: string
          last_account_deleted_at: string | null
          last_plan: string | null
          last_subscription_status: string | null
          subscription_expires_at: string | null
          total_signups: number
          trial_used: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_signup_at?: string
          id?: string
          last_account_deleted_at?: string | null
          last_plan?: string | null
          last_subscription_status?: string | null
          subscription_expires_at?: string | null
          total_signups?: number
          trial_used?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_signup_at?: string
          id?: string
          last_account_deleted_at?: string | null
          last_plan?: string | null
          last_subscription_status?: string | null
          subscription_expires_at?: string | null
          total_signups?: number
          trial_used?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      execution_logs: {
        Row: {
          automation_id: string | null
          created_at: string | null
          event_type: string | null
          id: string
          incoming_payload: Json | null
          processing_time_ms: number | null
          response_payload: Json | null
          source_platform: Database["public"]["Enums"]["platform_type"] | null
          status: Database["public"]["Enums"]["execution_status"] | null
          user_id: string
        }
        Insert: {
          automation_id?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string
          incoming_payload?: Json | null
          processing_time_ms?: number | null
          response_payload?: Json | null
          source_platform?: Database["public"]["Enums"]["platform_type"] | null
          status?: Database["public"]["Enums"]["execution_status"] | null
          user_id: string
        }
        Update: {
          automation_id?: string | null
          created_at?: string | null
          event_type?: string | null
          id?: string
          incoming_payload?: Json | null
          processing_time_ms?: number | null
          response_payload?: Json | null
          source_platform?: Database["public"]["Enums"]["platform_type"] | null
          status?: Database["public"]["Enums"]["execution_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_posts: {
        Row: {
          created_at: string
          engagement_count: number | null
          id: string
          is_synced: boolean | null
          linked_product_id: string | null
          media_type: string | null
          media_url: string | null
          page_id: string
          post_id: string
          post_text: string | null
          product_detected_name: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          engagement_count?: number | null
          id?: string
          is_synced?: boolean | null
          linked_product_id?: string | null
          media_type?: string | null
          media_url?: string | null
          page_id: string
          post_id: string
          post_text?: string | null
          product_detected_name?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          engagement_count?: number | null
          id?: string
          is_synced?: boolean | null
          linked_product_id?: string | null
          media_type?: string | null
          media_url?: string | null
          page_id?: string
          post_id?: string
          post_text?: string | null
          product_detected_name?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_posts_linked_product_id_fkey"
            columns: ["linked_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_message_logs: {
        Row: {
          created_at: string
          customer_followup_id: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          message_content: string
          message_type: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_followup_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          message_content: string
          message_type?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          customer_followup_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          message_content?: string
          message_type?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_message_logs_customer_followup_id_fkey"
            columns: ["customer_followup_id"]
            isOneToOne: false
            referencedRelation: "customer_followups"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_detection_logs: {
        Row: {
          action_taken: string | null
          created_at: string
          customer_name: string | null
          details: Json | null
          detection_type: string
          id: string
          ip_address: string | null
          is_blocked: boolean | null
          order_id: string | null
          phone_number: string | null
          risk_score: number | null
          shop_id: string | null
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          customer_name?: string | null
          details?: Json | null
          detection_type: string
          id?: string
          ip_address?: string | null
          is_blocked?: boolean | null
          order_id?: string | null
          phone_number?: string | null
          risk_score?: number | null
          shop_id?: string | null
          user_id: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          customer_name?: string | null
          details?: Json | null
          detection_type?: string
          id?: string
          ip_address?: string | null
          is_blocked?: boolean | null
          order_id?: string | null
          phone_number?: string | null
          risk_score?: number | null
          shop_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_detection_logs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_detection_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      incomplete_orders: {
        Row: {
          address: string | null
          cart_items: Json | null
          cart_total: number | null
          converted: boolean | null
          converted_order_id: string | null
          created_at: string
          customer_name: string | null
          device_info: Json | null
          email: string | null
          id: string
          ip_address: string | null
          is_retargeted: boolean | null
          last_retargeted_at: string | null
          phone_number: string | null
          retarget_count: number | null
          shop_id: string | null
          source_url: string | null
          step_reached: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          cart_items?: Json | null
          cart_total?: number | null
          converted?: boolean | null
          converted_order_id?: string | null
          created_at?: string
          customer_name?: string | null
          device_info?: Json | null
          email?: string | null
          id?: string
          ip_address?: string | null
          is_retargeted?: boolean | null
          last_retargeted_at?: string | null
          phone_number?: string | null
          retarget_count?: number | null
          shop_id?: string | null
          source_url?: string | null
          step_reached?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          cart_items?: Json | null
          cart_total?: number | null
          converted?: boolean | null
          converted_order_id?: string | null
          created_at?: string
          customer_name?: string | null
          device_info?: Json | null
          email?: string | null
          id?: string
          ip_address?: string | null
          is_retargeted?: boolean | null
          last_retargeted_at?: string | null
          phone_number?: string | null
          retarget_count?: number | null
          shop_id?: string | null
          source_url?: string | null
          step_reached?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incomplete_orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomplete_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_blacklist: {
        Row: {
          blocked_orders_count: number | null
          created_at: string
          id: string
          reason: string | null
          shop_id: string | null
          type: string
          user_id: string
          value: string
        }
        Insert: {
          blocked_orders_count?: number | null
          created_at?: string
          id?: string
          reason?: string | null
          shop_id?: string | null
          type: string
          user_id: string
          value: string
        }
        Update: {
          blocked_orders_count?: number | null
          created_at?: string
          id?: string
          reason?: string | null
          shop_id?: string | null
          type?: string
          user_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_blacklist_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_blacklist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          account_id: string | null
          completed_at: string | null
          created_at: string
          delivered_count: number | null
          failed_count: number | null
          id: string
          media_type: string | null
          media_url: string | null
          message_template: string
          name: string
          scheduled_at: string | null
          sent_count: number | null
          shop_id: string | null
          started_at: string | null
          status: string | null
          target_numbers: string[] | null
          total_recipients: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_template: string
          name: string
          scheduled_at?: string | null
          sent_count?: number | null
          shop_id?: string | null
          started_at?: string | null
          status?: string | null
          target_numbers?: string[] | null
          total_recipients?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivered_count?: number | null
          failed_count?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_template?: string
          name?: string
          scheduled_at?: string | null
          sent_count?: number | null
          shop_id?: string | null
          started_at?: string | null
          status?: string | null
          target_numbers?: string[] | null
          total_recipients?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "marketing_whatsapp_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_message_logs: {
        Row: {
          campaign_id: string | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          phone_number: string
          read_at: string | null
          sent_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          phone_number: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          phone_number?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_message_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_message_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_phone_numbers: {
        Row: {
          address: string | null
          business_name: string | null
          category: string | null
          contact_name: string | null
          created_at: string
          has_whatsapp: boolean | null
          id: string
          is_deleted: boolean | null
          is_validated: boolean | null
          notes: string | null
          phone_number: string
          shop_id: string | null
          source: string
          source_name: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          validation_date: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          category?: string | null
          contact_name?: string | null
          created_at?: string
          has_whatsapp?: boolean | null
          id?: string
          is_deleted?: boolean | null
          is_validated?: boolean | null
          notes?: string | null
          phone_number: string
          shop_id?: string | null
          source: string
          source_name?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          validation_date?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          category?: string | null
          contact_name?: string | null
          created_at?: string
          has_whatsapp?: boolean | null
          id?: string
          is_deleted?: boolean | null
          is_validated?: boolean | null
          notes?: string | null
          phone_number?: string
          shop_id?: string | null
          source?: string
          source_name?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          validation_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_phone_numbers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_phone_numbers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_whatsapp_accounts: {
        Row: {
          created_at: string
          id: string
          is_connected: boolean | null
          last_connected_at: string | null
          phone_number: string | null
          session_data: Json | null
          shop_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_connected_at?: string | null
          phone_number?: string | null
          session_data?: Json | null
          shop_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_connected_at?: string | null
          phone_number?: string | null
          session_data?: Json | null
          shop_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_whatsapp_accounts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_whatsapp_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_whatsapp_groups: {
        Row: {
          account_id: string | null
          created_at: string
          group_id: string
          group_name: string | null
          id: string
          last_synced_at: string | null
          member_count: number | null
          numbers_extracted: number | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          group_id: string
          group_name?: string | null
          id?: string
          last_synced_at?: string | null
          member_count?: number | null
          numbers_extracted?: number | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          group_id?: string
          group_name?: string | null
          id?: string
          last_synced_at?: string | null
          member_count?: number | null
          numbers_extracted?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_whatsapp_groups_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "marketing_whatsapp_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_whatsapp_groups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          notification_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          currency: string | null
          customer_address: string | null
          customer_name: string | null
          customer_phone: string | null
          discount: number | null
          external_customer_id: string | null
          external_id: string | null
          id: string
          items: Json
          order_date: string | null
          source_platform: Database["public"]["Enums"]["platform_type"] | null
          status: Database["public"]["Enums"]["order_status_type"] | null
          subtotal: number
          total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          external_customer_id?: string | null
          external_id?: string | null
          id?: string
          items: Json
          order_date?: string | null
          source_platform?: Database["public"]["Enums"]["platform_type"] | null
          status?: Database["public"]["Enums"]["order_status_type"] | null
          subtotal: number
          total: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          external_customer_id?: string | null
          external_id?: string | null
          id?: string
          items?: Json
          order_date?: string | null
          source_platform?: Database["public"]["Enums"]["platform_type"] | null
          status?: Database["public"]["Enums"]["order_status_type"] | null
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      outgoing_events: {
        Row: {
          account_id: string | null
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          payload: Json
          retry_count: number
          sent_at: string | null
          status: Database["public"]["Enums"]["webhook_event_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          last_error?: string | null
          payload?: Json
          retry_count?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["webhook_event_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          payload?: Json
          retry_count?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["webhook_event_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outgoing_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outgoing_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      page_memory: {
        Row: {
          account_id: string
          ai_behavior_rules: Json | null
          automation_settings: Json | null
          business_category: string | null
          business_description: string | null
          business_type: string | null
          created_at: string
          custom_instructions: string | null
          detected_language: string | null
          faq_context: string | null
          id: string
          page_id: string
          page_name: string | null
          payment_rules: Json | null
          preferred_tone: string | null
          products_summary: string | null
          selling_rules: Json | null
          support_whatsapp_number: string | null
          updated_at: string
          user_id: string
          webhook_subscribed: boolean | null
          webhook_subscribed_at: string | null
        }
        Insert: {
          account_id: string
          ai_behavior_rules?: Json | null
          automation_settings?: Json | null
          business_category?: string | null
          business_description?: string | null
          business_type?: string | null
          created_at?: string
          custom_instructions?: string | null
          detected_language?: string | null
          faq_context?: string | null
          id?: string
          page_id: string
          page_name?: string | null
          payment_rules?: Json | null
          preferred_tone?: string | null
          products_summary?: string | null
          selling_rules?: Json | null
          support_whatsapp_number?: string | null
          updated_at?: string
          user_id: string
          webhook_subscribed?: boolean | null
          webhook_subscribed_at?: string | null
        }
        Update: {
          account_id?: string
          ai_behavior_rules?: Json | null
          automation_settings?: Json | null
          business_category?: string | null
          business_description?: string | null
          business_type?: string | null
          created_at?: string
          custom_instructions?: string | null
          detected_language?: string | null
          faq_context?: string | null
          id?: string
          page_id?: string
          page_name?: string | null
          payment_rules?: Json | null
          preferred_tone?: string | null
          products_summary?: string | null
          selling_rules?: Json | null
          support_whatsapp_number?: string | null
          updated_at?: string
          user_id?: string
          webhook_subscribed?: boolean | null
          webhook_subscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_memory_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_name: string | null
          account_number: string | null
          api_key: string | null
          api_secret: string | null
          created_at: string
          display_order: number | null
          gateway_url: string | null
          icon: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          api_key?: string | null
          api_secret?: string | null
          created_at?: string
          display_order?: number | null
          gateway_url?: string | null
          icon?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          api_key?: string | null
          api_secret?: string | null
          created_at?: string
          display_order?: number | null
          gateway_url?: string | null
          icon?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: string
          id: string
          payment_method: string
          payment_method_account: string | null
          plan_id: string
          plan_name: string
          screenshot_url: string | null
          status: string
          subscription_type: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          payment_method: string
          payment_method_account?: string | null
          plan_id: string
          plan_name: string
          screenshot_url?: string | null
          status?: string
          subscription_type?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string
          payment_method_account?: string | null
          plan_id?: string
          plan_name?: string
          screenshot_url?: string | null
          status?: string
          subscription_type?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          badge: string | null
          badge_color: string | null
          created_at: string | null
          cta_text: string | null
          cta_variant: string | null
          currency: string | null
          description: string | null
          description_bn: string | null
          discount_percent: number | null
          display_order: number | null
          features: Json | null
          has_offline_shop_option: boolean | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          max_facebook_pages: number | null
          max_shops: number | null
          name: string
          name_bn: string | null
          offline_features: Json | null
          offline_shop_bundle_price_numeric: number | null
          offline_shop_price_numeric: number | null
          online_features: Json | null
          original_price_numeric: number | null
          period: string | null
          price_numeric: number | null
          updated_at: string | null
        }
        Insert: {
          badge?: string | null
          badge_color?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_variant?: string | null
          currency?: string | null
          description?: string | null
          description_bn?: string | null
          discount_percent?: number | null
          display_order?: number | null
          features?: Json | null
          has_offline_shop_option?: boolean | null
          id: string
          is_active?: boolean | null
          is_popular?: boolean | null
          max_facebook_pages?: number | null
          max_shops?: number | null
          name: string
          name_bn?: string | null
          offline_features?: Json | null
          offline_shop_bundle_price_numeric?: number | null
          offline_shop_price_numeric?: number | null
          online_features?: Json | null
          original_price_numeric?: number | null
          period?: string | null
          price_numeric?: number | null
          updated_at?: string | null
        }
        Update: {
          badge?: string | null
          badge_color?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_variant?: string | null
          currency?: string | null
          description?: string | null
          description_bn?: string | null
          discount_percent?: number | null
          display_order?: number | null
          features?: Json | null
          has_offline_shop_option?: boolean | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          max_facebook_pages?: number | null
          max_shops?: number | null
          name?: string
          name_bn?: string | null
          offline_features?: Json | null
          offline_shop_bundle_price_numeric?: number | null
          offline_shop_price_numeric?: number | null
          online_features?: Json | null
          original_price_numeric?: number | null
          period?: string | null
          price_numeric?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      product_media: {
        Row: {
          created_at: string
          description: string | null
          file_name: string | null
          file_path: string | null
          file_size_bytes: number | null
          file_url: string
          id: string
          media_type: string
          product_id: string
          product_source: string
          sort_order: number | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url: string
          id?: string
          media_type: string
          product_id: string
          product_source?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          media_type?: string
          product_id?: string
          product_source?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          price_adjustment: number | null
          product_id: string
          size: string | null
          sku: string | null
          stock_quantity: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_adjustment?: number | null
          product_id: string
          size?: string | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_adjustment?: number | null
          product_id?: string
          size?: string | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          expiry_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          min_stock_alert: number | null
          name: string
          price: number
          purchase_price: number | null
          sku: string | null
          stock_quantity: number | null
          supplier_name: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock_alert?: number | null
          name: string
          price?: number
          purchase_price?: number | null
          sku?: string | null
          stock_quantity?: number | null
          supplier_name?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock_alert?: number | null
          name?: string
          price?: number
          purchase_price?: number | null
          sku?: string | null
          stock_quantity?: number | null
          supplier_name?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          is_verified: boolean | null
          likes_count: number | null
          name: string
          rating: number
          user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          likes_count?: number | null
          name: string
          rating: number
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          likes_count?: number | null
          name?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_settings: {
        Row: {
          bing_verification_code: string | null
          created_at: string | null
          custom_head_scripts: string | null
          default_description: string | null
          default_keywords: string | null
          default_title: string | null
          facebook_pixel_id: string | null
          google_analytics_id: string | null
          google_tag_manager_id: string | null
          google_verification_code: string | null
          id: string
          og_image_url: string | null
          robots_txt_content: string | null
          sitemap_enabled: boolean | null
          twitter_card_type: string | null
          updated_at: string | null
        }
        Insert: {
          bing_verification_code?: string | null
          created_at?: string | null
          custom_head_scripts?: string | null
          default_description?: string | null
          default_keywords?: string | null
          default_title?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          google_tag_manager_id?: string | null
          google_verification_code?: string | null
          id?: string
          og_image_url?: string | null
          robots_txt_content?: string | null
          sitemap_enabled?: boolean | null
          twitter_card_type?: string | null
          updated_at?: string | null
        }
        Update: {
          bing_verification_code?: string | null
          created_at?: string | null
          custom_head_scripts?: string | null
          default_description?: string | null
          default_keywords?: string | null
          default_title?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          google_tag_manager_id?: string | null
          google_verification_code?: string | null
          id?: string
          og_image_url?: string | null
          robots_txt_content?: string | null
          sitemap_enabled?: boolean | null
          twitter_card_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shop_cash_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          reference_id: string | null
          reference_type: string | null
          shop_id: string | null
          source: string
          transaction_date: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          shop_id?: string | null
          source: string
          transaction_date?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          shop_id?: string | null
          source?: string
          transaction_date?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_cash_transactions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_cash_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          shop_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          shop_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          shop_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_categories_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_customers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          opening_balance: number | null
          phone: string | null
          shop_id: string | null
          total_due: number | null
          total_purchases: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          opening_balance?: number | null
          phone?: string | null
          shop_id?: string | null
          total_due?: number | null
          total_purchases?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          opening_balance?: number | null
          phone?: string | null
          shop_id?: string | null
          total_due?: number | null
          total_purchases?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_customers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_daily_cash_register: {
        Row: {
          cash_difference: number | null
          closing_cash: number | null
          closing_time: string | null
          created_at: string
          expected_cash: number | null
          id: string
          notes: string | null
          opening_cash: number
          opening_time: string | null
          register_date: string
          shop_id: string | null
          status: string | null
          total_card_sales: number | null
          total_cash_sales: number | null
          total_deposits: number | null
          total_due_collected: number | null
          total_expenses: number | null
          total_mobile_sales: number | null
          total_sales: number | null
          total_withdrawals: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cash_difference?: number | null
          closing_cash?: number | null
          closing_time?: string | null
          created_at?: string
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opening_cash?: number
          opening_time?: string | null
          register_date: string
          shop_id?: string | null
          status?: string | null
          total_card_sales?: number | null
          total_cash_sales?: number | null
          total_deposits?: number | null
          total_due_collected?: number | null
          total_expenses?: number | null
          total_mobile_sales?: number | null
          total_sales?: number | null
          total_withdrawals?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cash_difference?: number | null
          closing_cash?: number | null
          closing_time?: string | null
          created_at?: string
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opening_cash?: number
          opening_time?: string | null
          register_date?: string
          shop_id?: string | null
          status?: string | null
          total_card_sales?: number | null
          total_cash_sales?: number | null
          total_deposits?: number | null
          total_due_collected?: number | null
          total_expenses?: number | null
          total_mobile_sales?: number | null
          total_sales?: number | null
          total_withdrawals?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_daily_cash_register_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_daily_cash_register_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_damages: {
        Row: {
          created_at: string | null
          damage_date: string | null
          id: string
          loss_amount: number | null
          notes: string | null
          product_id: string | null
          product_name: string
          quantity: number
          reason: string | null
          shop_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          damage_date?: string | null
          id?: string
          loss_amount?: number | null
          notes?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          reason?: string | null
          shop_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          damage_date?: string | null
          id?: string
          loss_amount?: number | null
          notes?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          reason?: string | null
          shop_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_damages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_damages_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_damages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string | null
          expense_date: string | null
          id: string
          notes: string | null
          payment_method: string | null
          receipt_url: string | null
          shop_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          shop_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          shop_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_expenses_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_loan_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          installment_number: number | null
          late_fee: number | null
          loan_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          installment_number?: number | null
          late_fee?: number | null
          loan_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          installment_number?: number | null
          late_fee?: number | null
          loan_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "shop_loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_loan_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_loans: {
        Row: {
          created_at: string
          id: string
          installment_amount: number
          interest_rate: number | null
          lender_name: string
          lender_type: string
          loan_amount: number
          next_payment_date: string | null
          notes: string | null
          paid_installments: number
          payment_day: number | null
          remaining_amount: number
          shop_id: string | null
          start_date: string
          status: string
          total_installments: number
          total_paid: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          installment_amount?: number
          interest_rate?: number | null
          lender_name: string
          lender_type?: string
          loan_amount?: number
          next_payment_date?: string | null
          notes?: string | null
          paid_installments?: number
          payment_day?: number | null
          remaining_amount?: number
          shop_id?: string | null
          start_date?: string
          status?: string
          total_installments?: number
          total_paid?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          installment_amount?: number
          interest_rate?: number | null
          lender_name?: string
          lender_type?: string
          loan_amount?: number
          next_payment_date?: string | null
          notes?: string | null
          paid_installments?: number
          payment_day?: number | null
          remaining_amount?: number
          shop_id?: string | null
          start_date?: string
          status?: string
          total_installments?: number
          total_paid?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_loans_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_loans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_product_history: {
        Row: {
          action_type: string
          created_at: string
          id: string
          product_id: string | null
          product_name: string
          purchase_price: number | null
          quantity_added: number
          selling_price: number | null
          shop_id: string | null
          user_id: string
        }
        Insert: {
          action_type?: string
          created_at?: string
          id?: string
          product_id?: string | null
          product_name: string
          purchase_price?: number | null
          quantity_added?: number
          selling_price?: number | null
          shop_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string
          purchase_price?: number | null
          quantity_added?: number
          selling_price?: number | null
          shop_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_product_history_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_product_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          average_cost: number | null
          barcode: string | null
          brand: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          expiry_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          min_stock_alert: number | null
          name: string
          notes: string | null
          online_sku: string | null
          purchase_date: string | null
          purchase_price: number
          selling_price: number
          shop_id: string | null
          sku: string | null
          stock_quantity: number | null
          supplier_contact: string | null
          supplier_name: string | null
          tax_percent: number | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_cost?: number | null
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock_alert?: number | null
          name: string
          notes?: string | null
          online_sku?: string | null
          purchase_date?: string | null
          purchase_price?: number
          selling_price?: number
          shop_id?: string | null
          sku?: string | null
          stock_quantity?: number | null
          supplier_contact?: string | null
          supplier_name?: string | null
          tax_percent?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_cost?: number | null
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock_alert?: number | null
          name?: string
          notes?: string | null
          online_sku?: string | null
          purchase_date?: string | null
          purchase_price?: number
          selling_price?: number
          shop_id?: string | null
          sku?: string | null
          stock_quantity?: number | null
          supplier_contact?: string | null
          supplier_name?: string | null
          tax_percent?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "shop_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_purchase_items: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: string
          product_id: string | null
          product_name: string
          purchase_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          product_id?: string | null
          product_name: string
          purchase_id: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          product_id?: string | null
          product_name?: string
          purchase_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "shop_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_purchase_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          purchase_id: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          purchase_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          purchase_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_purchase_payments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "shop_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_purchase_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_purchases: {
        Row: {
          created_at: string | null
          discount: number | null
          due_amount: number | null
          id: string
          invoice_number: string | null
          landing_cost: number | null
          notes: string | null
          paid_amount: number | null
          payment_status: string | null
          purchase_date: string | null
          shop_id: string | null
          supplier_contact: string | null
          supplier_id: string | null
          supplier_name: string | null
          total_amount: number
          transport_cost: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          due_amount?: number | null
          id?: string
          invoice_number?: string | null
          landing_cost?: number | null
          notes?: string | null
          paid_amount?: number | null
          payment_status?: string | null
          purchase_date?: string | null
          shop_id?: string | null
          supplier_contact?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          total_amount?: number
          transport_cost?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          due_amount?: number | null
          id?: string
          invoice_number?: string | null
          landing_cost?: number | null
          notes?: string | null
          paid_amount?: number | null
          payment_status?: string | null
          purchase_date?: string | null
          shop_id?: string | null
          supplier_contact?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          total_amount?: number
          transport_cost?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_purchases_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "shop_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_quick_expenses: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          expense_date: string
          id: string
          shop_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          shop_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          shop_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_quick_expenses_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_quick_expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_returns: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          id: string
          is_resellable: boolean | null
          loss_amount: number | null
          notes: string | null
          original_sale_date: string | null
          original_sale_id: string | null
          original_unit_price: number | null
          photo_url: string | null
          product_id: string | null
          product_name: string
          quantity: number
          refund_amount: number | null
          return_date: string | null
          return_reason: string
          shop_id: string | null
          status: string | null
          stock_restored: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          is_resellable?: boolean | null
          loss_amount?: number | null
          notes?: string | null
          original_sale_date?: string | null
          original_sale_id?: string | null
          original_unit_price?: number | null
          photo_url?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          refund_amount?: number | null
          return_date?: string | null
          return_reason: string
          shop_id?: string | null
          status?: string | null
          stock_restored?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          is_resellable?: boolean | null
          loss_amount?: number | null
          notes?: string | null
          original_sale_date?: string | null
          original_sale_id?: string | null
          original_unit_price?: number | null
          photo_url?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          refund_amount?: number | null
          return_date?: string | null
          return_reason?: string
          shop_id?: string | null
          status?: string | null
          stock_restored?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "shop_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_returns_original_sale_id_fkey"
            columns: ["original_sale_id"]
            isOneToOne: false
            referencedRelation: "shop_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_returns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_returns_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_returns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_sale_items: {
        Row: {
          created_at: string | null
          discount: number | null
          id: string
          product_id: string | null
          product_name: string
          profit: number | null
          purchase_price: number | null
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          id?: string
          product_id?: string | null
          product_name: string
          profit?: number | null
          purchase_price?: number | null
          quantity?: number
          sale_id: string
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          id?: string
          product_id?: string | null
          product_name?: string
          profit?: number | null
          purchase_price?: number | null
          quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "shop_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_sales: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          discount: number | null
          due_amount: number | null
          id: string
          invoice_number: string
          notes: string | null
          paid_amount: number | null
          payment_method: string | null
          payment_status: string | null
          sale_date: string | null
          shop_id: string | null
          source: string | null
          subtotal: number
          tax: number | null
          total: number
          total_cost: number | null
          total_profit: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          due_amount?: number | null
          id?: string
          invoice_number: string
          notes?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          sale_date?: string | null
          shop_id?: string | null
          source?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          total_cost?: number | null
          total_profit?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number | null
          due_amount?: number | null
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          sale_date?: string | null
          shop_id?: string | null
          source?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          total_cost?: number | null
          total_profit?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "shop_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_sales_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_sales_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_scanner_devices: {
        Row: {
          avg_scan_speed: number | null
          created_at: string
          device_name: string
          device_type: string
          id: string
          is_active: boolean | null
          last_connected_at: string | null
          product_id: string | null
          settings: Json | null
          shop_id: string | null
          total_scans: number | null
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          avg_scan_speed?: number | null
          created_at?: string
          device_name: string
          device_type?: string
          id?: string
          is_active?: boolean | null
          last_connected_at?: string | null
          product_id?: string | null
          settings?: Json | null
          shop_id?: string | null
          total_scans?: number | null
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          avg_scan_speed?: number | null
          created_at?: string
          device_name?: string
          device_type?: string
          id?: string
          is_active?: boolean | null
          last_connected_at?: string | null
          product_id?: string | null
          settings?: Json | null
          shop_id?: string | null
          total_scans?: number | null
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_scanner_devices_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_scanner_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_scanner_logs: {
        Row: {
          barcode: string
          created_at: string | null
          id: string
          is_matched: boolean | null
          product_id: string | null
          product_name: string | null
          scan_speed: number | null
          scan_type: string | null
          shop_id: string | null
          user_id: string
        }
        Insert: {
          barcode: string
          created_at?: string | null
          id?: string
          is_matched?: boolean | null
          product_id?: string | null
          product_name?: string | null
          scan_speed?: number | null
          scan_type?: string | null
          shop_id?: string | null
          user_id: string
        }
        Update: {
          barcode?: string
          created_at?: string | null
          id?: string
          is_matched?: boolean | null
          product_id?: string | null
          product_name?: string | null
          scan_speed?: number | null
          scan_type?: string | null
          shop_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_scanner_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_scanner_logs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_settings: {
        Row: {
          branch_name: string | null
          created_at: string | null
          currency: string | null
          data_retention_days: number | null
          default_tax_rate: number | null
          due_reminder_sms_template: string | null
          enable_online_sync: boolean | null
          id: string
          invoice_footer: string | null
          invoice_format: string | null
          invoice_prefix: string | null
          logo_url: string | null
          opening_cash_balance: number | null
          opening_date: string | null
          receipt_font_size: string | null
          receipt_footer_text: string | null
          receipt_header_text: string | null
          receipt_size: string | null
          scanner_config: Json | null
          scanner_last_connected_at: string | null
          scanner_total_scans: number | null
          shop_address: string | null
          shop_email: string | null
          shop_id: string | null
          shop_name: string
          shop_phone: string | null
          show_logo_on_receipt: boolean | null
          show_payment_method: boolean | null
          show_tax_on_receipt: boolean | null
          sms_api_key: string | null
          sms_sender_id: string | null
          tax_rate: number | null
          terms_and_conditions: string | null
          thank_you_message: string | null
          trash_passcode_hash: string | null
          updated_at: string | null
          use_platform_sms: boolean | null
          user_id: string
        }
        Insert: {
          branch_name?: string | null
          created_at?: string | null
          currency?: string | null
          data_retention_days?: number | null
          default_tax_rate?: number | null
          due_reminder_sms_template?: string | null
          enable_online_sync?: boolean | null
          id?: string
          invoice_footer?: string | null
          invoice_format?: string | null
          invoice_prefix?: string | null
          logo_url?: string | null
          opening_cash_balance?: number | null
          opening_date?: string | null
          receipt_font_size?: string | null
          receipt_footer_text?: string | null
          receipt_header_text?: string | null
          receipt_size?: string | null
          scanner_config?: Json | null
          scanner_last_connected_at?: string | null
          scanner_total_scans?: number | null
          shop_address?: string | null
          shop_email?: string | null
          shop_id?: string | null
          shop_name?: string
          shop_phone?: string | null
          show_logo_on_receipt?: boolean | null
          show_payment_method?: boolean | null
          show_tax_on_receipt?: boolean | null
          sms_api_key?: string | null
          sms_sender_id?: string | null
          tax_rate?: number | null
          terms_and_conditions?: string | null
          thank_you_message?: string | null
          trash_passcode_hash?: string | null
          updated_at?: string | null
          use_platform_sms?: boolean | null
          user_id: string
        }
        Update: {
          branch_name?: string | null
          created_at?: string | null
          currency?: string | null
          data_retention_days?: number | null
          default_tax_rate?: number | null
          due_reminder_sms_template?: string | null
          enable_online_sync?: boolean | null
          id?: string
          invoice_footer?: string | null
          invoice_format?: string | null
          invoice_prefix?: string | null
          logo_url?: string | null
          opening_cash_balance?: number | null
          opening_date?: string | null
          receipt_font_size?: string | null
          receipt_footer_text?: string | null
          receipt_header_text?: string | null
          receipt_size?: string | null
          scanner_config?: Json | null
          scanner_last_connected_at?: string | null
          scanner_total_scans?: number | null
          shop_address?: string | null
          shop_email?: string | null
          shop_id?: string | null
          shop_name?: string
          shop_phone?: string | null
          show_logo_on_receipt?: boolean | null
          show_payment_method?: boolean | null
          show_tax_on_receipt?: boolean | null
          sms_api_key?: string | null
          sms_sender_id?: string | null
          tax_rate?: number | null
          terms_and_conditions?: string | null
          thank_you_message?: string | null
          trash_passcode_hash?: string | null
          updated_at?: string | null
          use_platform_sms?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_settings_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_staff_users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          permissions: Json | null
          phone: string | null
          role: string
          shop_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          permissions?: Json | null
          phone?: string | null
          role?: string
          shop_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          permissions?: Json | null
          phone?: string | null
          role?: string
          shop_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_staff_users_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_staff_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_stock_adjustments: {
        Row: {
          adjustment_date: string | null
          cost_impact: number | null
          created_at: string | null
          id: string
          notes: string | null
          product_id: string | null
          product_name: string
          quantity: number
          reason: string | null
          shop_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          adjustment_date?: string | null
          cost_impact?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          reason?: string | null
          shop_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          adjustment_date?: string | null
          cost_impact?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          reason?: string | null
          shop_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_stock_adjustments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_stock_adjustments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_stock_batches: {
        Row: {
          batch_date: string
          created_at: string
          expiry_date: string | null
          id: string
          is_initial_batch: boolean | null
          notes: string | null
          product_id: string
          purchase_id: string | null
          purchase_item_id: string | null
          quantity: number
          remaining_quantity: number
          shop_id: string | null
          unit_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          batch_date?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_initial_batch?: boolean | null
          notes?: string | null
          product_id: string
          purchase_id?: string | null
          purchase_item_id?: string | null
          quantity?: number
          remaining_quantity?: number
          shop_id?: string | null
          unit_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          batch_date?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_initial_batch?: boolean | null
          notes?: string | null
          product_id?: string
          purchase_id?: string | null
          purchase_item_id?: string | null
          quantity?: number
          remaining_quantity?: number
          shop_id?: string | null
          unit_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_stock_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_stock_batches_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "shop_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_stock_batches_purchase_item_id_fkey"
            columns: ["purchase_item_id"]
            isOneToOne: false
            referencedRelation: "shop_purchase_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_stock_batches_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_supplier_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          purchase_id: string | null
          shop_id: string | null
          supplier_id: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          purchase_id?: string | null
          shop_id?: string | null
          supplier_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          purchase_id?: string | null
          shop_id?: string | null
          supplier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_supplier_payments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "shop_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_supplier_payments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "shop_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_supplier_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_supplier_returns: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          photo_url: string | null
          product_id: string | null
          product_name: string
          purchase_id: string | null
          quantity: number
          refund_amount: number | null
          return_date: string | null
          return_reason: string
          shop_id: string | null
          status: string | null
          supplier_id: string | null
          supplier_name: string | null
          unit_cost: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          product_id?: string | null
          product_name: string
          purchase_id?: string | null
          quantity?: number
          refund_amount?: number | null
          return_date?: string | null
          return_reason: string
          shop_id?: string | null
          status?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          product_id?: string | null
          product_name?: string
          purchase_id?: string | null
          quantity?: number
          refund_amount?: number | null
          return_date?: string | null
          return_reason?: string
          shop_id?: string | null
          status?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_supplier_returns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_supplier_returns_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "shop_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_supplier_returns_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_supplier_returns_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "shop_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_supplier_returns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_suppliers: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_name: string | null
          business_type: string | null
          category: string | null
          company_name: string | null
          contact_person: string | null
          created_at: string | null
          credit_limit: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          opening_balance: number | null
          payment_terms: string | null
          phone: string | null
          rating: number | null
          shop_id: string | null
          supplier_code: string | null
          tax_id: string | null
          total_due: number | null
          total_purchases: number | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          business_type?: string | null
          category?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          opening_balance?: number | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          shop_id?: string | null
          supplier_code?: string | null
          tax_id?: string | null
          total_due?: number | null
          total_purchases?: number | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_name?: string | null
          business_type?: string | null
          category?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          opening_balance?: number | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          shop_id?: string | null
          supplier_code?: string | null
          tax_id?: string | null
          total_due?: number | null
          total_purchases?: number | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_suppliers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_suppliers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_trash: {
        Row: {
          data: Json
          deleted_at: string
          expires_at: string
          id: string
          original_id: string
          original_table: string
          permanently_deleted_at: string | null
          restored_at: string | null
          shop_id: string | null
          user_id: string
        }
        Insert: {
          data: Json
          deleted_at?: string
          expires_at?: string
          id?: string
          original_id: string
          original_table: string
          permanently_deleted_at?: string | null
          restored_at?: string | null
          shop_id?: string | null
          user_id: string
        }
        Update: {
          data?: Json
          deleted_at?: string
          expires_at?: string
          id?: string
          original_id?: string
          original_table?: string
          permanently_deleted_at?: string | null
          restored_at?: string | null
          shop_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_trash_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_trash_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shops_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          about_us: string | null
          billing_email: string | null
          city: string | null
          company_address: string | null
          company_name: string
          copyright_text: string | null
          country: string | null
          created_at: string | null
          demo_video_enabled: boolean | null
          demo_video_type: string | null
          demo_video_upload_url: string | null
          demo_video_youtube_url: string | null
          facebook_url: string | null
          favicon_url: string | null
          id: string
          instagram_url: string | null
          legal_contact_email: string | null
          linkedin_url: string | null
          logo_url: string | null
          offline_shop_enabled: boolean | null
          online_business_enabled: boolean | null
          phone_number: string | null
          platform_sms_api_key: string | null
          platform_sms_enabled: boolean | null
          platform_sms_provider: string | null
          platform_sms_sender_id: string | null
          postal_code: string | null
          sms_limit_business: number | null
          sms_limit_lifetime: number | null
          sms_limit_professional: number | null
          sms_limit_starter: number | null
          sms_limit_trial: number | null
          state: string | null
          support_email: string | null
          tagline: string | null
          twitter_url: string | null
          updated_at: string | null
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          about_us?: string | null
          billing_email?: string | null
          city?: string | null
          company_address?: string | null
          company_name?: string
          copyright_text?: string | null
          country?: string | null
          created_at?: string | null
          demo_video_enabled?: boolean | null
          demo_video_type?: string | null
          demo_video_upload_url?: string | null
          demo_video_youtube_url?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          id?: string
          instagram_url?: string | null
          legal_contact_email?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          offline_shop_enabled?: boolean | null
          online_business_enabled?: boolean | null
          phone_number?: string | null
          platform_sms_api_key?: string | null
          platform_sms_enabled?: boolean | null
          platform_sms_provider?: string | null
          platform_sms_sender_id?: string | null
          postal_code?: string | null
          sms_limit_business?: number | null
          sms_limit_lifetime?: number | null
          sms_limit_professional?: number | null
          sms_limit_starter?: number | null
          sms_limit_trial?: number | null
          state?: string | null
          support_email?: string | null
          tagline?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          about_us?: string | null
          billing_email?: string | null
          city?: string | null
          company_address?: string | null
          company_name?: string
          copyright_text?: string | null
          country?: string | null
          created_at?: string | null
          demo_video_enabled?: boolean | null
          demo_video_type?: string | null
          demo_video_upload_url?: string | null
          demo_video_youtube_url?: string | null
          facebook_url?: string | null
          favicon_url?: string | null
          id?: string
          instagram_url?: string | null
          legal_contact_email?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          offline_shop_enabled?: boolean | null
          online_business_enabled?: boolean | null
          phone_number?: string | null
          platform_sms_api_key?: string | null
          platform_sms_enabled?: boolean | null
          platform_sms_provider?: string | null
          platform_sms_sender_id?: string | null
          postal_code?: string | null
          sms_limit_business?: number | null
          sms_limit_lifetime?: number | null
          sms_limit_professional?: number | null
          sms_limit_starter?: number | null
          sms_limit_trial?: number | null
          state?: string | null
          support_email?: string | null
          tagline?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      sms_usage_logs: {
        Row: {
          created_at: string | null
          id: string
          sent_at: string | null
          sms_count: number
          sms_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          sent_at?: string | null
          sms_count?: number
          sms_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sent_at?: string | null
          sms_count?: number
          sms_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_reminders: {
        Row: {
          id: string
          reminder_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          reminder_type: string
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          reminder_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          ends_at: string | null
          id: string
          last_payment_id: string | null
          plan: Database["public"]["Enums"]["subscription_plan_type"]
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status_type"]
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          ends_at?: string | null
          id?: string
          last_payment_id?: string | null
          plan: Database["public"]["Enums"]["subscription_plan_type"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status_type"]
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          ends_at?: string | null
          id?: string
          last_payment_id?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan_type"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json | null
          source: string
          source_id: string | null
          status: string
          target: string | null
          target_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          source: string
          source_id?: string | null
          status?: string
          target?: string | null
          target_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          source?: string
          source_id?: string | null
          status?: string
          target?: string | null
          target_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_settings: {
        Row: {
          created_at: string
          id: string
          master_inventory: string
          sync_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          master_inventory?: string
          sync_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          master_inventory?: string
          sync_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          daily_digest: boolean
          default_tone: string
          email_notifications: boolean
          id: string
          push_notifications: boolean
          response_language: string
          sound_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_digest?: boolean
          default_tone?: string
          email_notifications?: boolean
          id?: string
          push_notifications?: boolean
          response_language?: string
          sound_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_digest?: boolean
          default_tone?: string
          email_notifications?: boolean
          id?: string
          push_notifications?: boolean
          response_language?: string
          sound_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_provider: string | null
          avatar_url: string | null
          can_sync_business: boolean
          created_at: string | null
          display_name: string | null
          email: string
          email_verified: boolean | null
          google_id: string | null
          has_used_trial: boolean
          id: string
          is_active: boolean | null
          is_trial_active: boolean | null
          password_hash: string
          phone: string | null
          phone_verified: boolean | null
          status: string
          subscription_ends_at: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan_type"]
          subscription_started_at: string | null
          subscription_type: string | null
          support_whatsapp_number: string | null
          trial_end_date: string | null
          trial_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          can_sync_business?: boolean
          created_at?: string | null
          display_name?: string | null
          email: string
          email_verified?: boolean | null
          google_id?: string | null
          has_used_trial?: boolean
          id?: string
          is_active?: boolean | null
          is_trial_active?: boolean | null
          password_hash: string
          phone?: string | null
          phone_verified?: boolean | null
          status?: string
          subscription_ends_at?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan_type"]
          subscription_started_at?: string | null
          subscription_type?: string | null
          support_whatsapp_number?: string | null
          trial_end_date?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          can_sync_business?: boolean
          created_at?: string | null
          display_name?: string | null
          email?: string
          email_verified?: boolean | null
          google_id?: string | null
          has_used_trial?: boolean
          id?: string
          is_active?: boolean | null
          is_trial_active?: boolean | null
          password_hash?: string
          phone?: string | null
          phone_verified?: boolean | null
          status?: string
          subscription_ends_at?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan_type"]
          subscription_started_at?: string | null
          subscription_type?: string | null
          support_whatsapp_number?: string | null
          trial_end_date?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      verification_otps: {
        Row: {
          created_at: string
          email_otp: number | null
          id: string
          phone_otp: number | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_otp?: number | null
          id?: string
          phone_otp?: number | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_otp?: number | null
          id?: string
          phone_otp?: number | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_otps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configs: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_coming_soon: boolean | null
          name: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id: string
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          name: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          name?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_email_use_trial: { Args: { p_email: string }; Returns: Json }
      cleanup_old_execution_logs: { Args: never; Returns: undefined }
      delete_user_completely: {
        Args: { p_preserve_email_history?: boolean; p_user_id: string }
        Returns: Json
      }
      generate_invoice_number: { Args: never; Returns: string }
      generate_supplier_code: { Args: { p_user_id: string }; Returns: string }
      get_user_dashboard_stats: { Args: { p_user_id: string }; Returns: Json }
      get_user_execution_logs: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          automation_id: string
          created_at: string
          event_type: string
          id: string
          incoming_payload: Json
          processing_time_ms: number
          response_payload: Json
          source_platform: string
          status: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_scanner_scans: {
        Args: { p_shop_id?: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      automation_type: "message" | "comment" | "image" | "voice" | "mixed"
      execution_status: "success" | "failed"
      invoice_status_type: "unpaid" | "paid" | "refunded"
      order_status_type:
        | "pending"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "returned"
        | "damaged"
        | "expired"
      platform_type: "facebook" | "whatsapp" | "email"
      subscription_plan_type:
        | "none"
        | "trial"
        | "starter"
        | "professional"
        | "business"
        | "lifetime"
      subscription_status_type: "active" | "cancelled" | "expired"
      webhook_event_status: "pending" | "sent" | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      automation_type: ["message", "comment", "image", "voice", "mixed"],
      execution_status: ["success", "failed"],
      invoice_status_type: ["unpaid", "paid", "refunded"],
      order_status_type: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
        "damaged",
        "expired",
      ],
      platform_type: ["facebook", "whatsapp", "email"],
      subscription_plan_type: [
        "none",
        "trial",
        "starter",
        "professional",
        "business",
        "lifetime",
      ],
      subscription_status_type: ["active", "cancelled", "expired"],
      webhook_event_status: ["pending", "sent", "error"],
    },
  },
} as const
