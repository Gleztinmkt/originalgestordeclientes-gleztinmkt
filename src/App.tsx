import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";

// Lazy load components
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const CalendarView = lazy(() => import("@/components/calendar/CalendarView"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (replaces cacheTime)
    },
  },
});

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles = [] }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        setSession(session);

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (!mounted) return;
          setUserRole(profile?.role || null);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      setSession(session);
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!mounted) return;
        setUserRole(profile?.role || null);
      } else {
        setUserRole(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (userRole && (userRole === 'designer' || userRole === 'calendar_viewer')) {
    return <Navigate to="/calendar" replace />;
  }

  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GoogleOAuthProvider clientId="280195859714-4fgds66d11sbrdb9dem19jv50g7mhsi5.apps.googleusercontent.com">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'marketing_agent']}>
                    <Index />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/calendar" 
                element={
                  <ProtectedRoute allowedRoles={['calendar_viewer', 'admin', 'marketing_agent', 'designer']}>
                    <CalendarView clients={[]} />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </GoogleOAuthProvider>
  </QueryClientProvider>
);

export default App;