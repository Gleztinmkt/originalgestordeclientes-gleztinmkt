import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

let supabase: ReturnType<typeof createClient>;

try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    toast({
      title: "Error de configuración",
      description: "Por favor, asegúrate de que Supabase esté correctamente conectado en el menú superior derecho.",
      variant: "destructive",
    });
    
    // Provide dummy values to prevent runtime crashes
    supabase = createClient('https://placeholder-url.supabase.co', 'placeholder-key');
  } else {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Provide dummy values to prevent runtime crashes
  supabase = createClient('https://placeholder-url.supabase.co', 'placeholder-key');
}

export { supabase };