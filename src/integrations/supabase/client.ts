// Supabase client for AutoFloy Offline Business Shop
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xvwsqxfydvagfhfkwxdm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3NxeGZ5ZHZhZ2ZoZmt3eGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzA2NjksImV4cCI6MjA4MzY0NjY2OX0.gH8ETokqoykpkOtWxkcOoKj2M_rx-IQ0JTAIkiqG5Tc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});