import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://rnwlqsnvswuecmqhsfww.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJud2xxc252c3d1ZWNtcWhzZnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MjIzMzMsImV4cCI6MjA1MTE5ODMzM30.0BphzHhxCemowSATSx9zpU84abBGiDp-_yLv1EA-QC4";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Ensure URL is properly formatted without trailing slashes
const formattedUrl = SUPABASE_URL.replace(/\/+$/, '');

export const supabase = createClient<Database>(
  formattedUrl,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
  }
);