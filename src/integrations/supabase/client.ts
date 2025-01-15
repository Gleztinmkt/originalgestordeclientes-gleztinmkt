import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://rnwlqsnvswuecmqhsfww.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJud2xxc252c3d1ZWNtcWhzZnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MjIzMzMsImV4cCI6MjA1MTE5ODMzM30.0BphzHhxCemowSATSx9zpU84abBGiDp-_yLv1EA-QC4";

// Ensure URL is properly formatted without trailing slashes
const formattedUrl = SUPABASE_URL.replace(/\/+$/, '');

export const supabase = createClient<Database>(
  formattedUrl,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
  }
);