import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Login from "./pages/Login";
import { Session } from '@supabase/supabase-js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session and set up auth state listener
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Current session:", currentSession);
        setSession(currentSession);

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          console.log("Auth state changed:", _event, session);
          
          if (_event === 'SIGNED_OUT') {
            // Clear session on sign out
            setSession(null);
          } else if (session) {
            // Validate and update session
            const { data: { session: validSession } } = await supabase.auth.getSession();
            setSession(validSession);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear session on error
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <GoogleOAuthProvider clientId="280195859714-4fgds66d11sbrdb9dem19jv50g7mhsi5.apps.googleusercontent.com">
            <Toaster />
            <Sonner />
            <Routes>
              <Route
                path="/login"
                element={session ? <Navigate to="/" replace /> : <Login />}
              />
              <Route
                path="/"
                element={session ? <Index /> : <Navigate to="/login" replace />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </GoogleOAuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;