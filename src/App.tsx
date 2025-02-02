import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Index from "./pages/Index";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleSessionError = () => {
      // Clear any potentially invalid session data
      supabase.auth.signOut();
      setSession(null);
      toast({
        title: "Sesión expirada",
        description: "Por favor, inicia sesión nuevamente.",
        variant: "destructive"
      });
    };

    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error al obtener la sesión inicial:', error);
          handleSessionError();
          return;
        }

        setSession(initialSession);
      } catch (error) {
        console.error('Error al obtener la sesión inicial:', error);
        handleSessionError();
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event, currentSession);
      
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setSession(null);
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión exitosamente."
        });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(currentSession);
      } else if (event === 'USER_UPDATED') {
        setSession(currentSession);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return null;
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
            </Routes>
          </GoogleOAuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;