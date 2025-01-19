import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { CalendarView } from "@/components/calendar/CalendarView";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/components/types/client";

const queryClient = new QueryClient();

const CalendarWrapper = () => {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching clients:', error);
        return [];
      }

      // Transform the data to match the Client type
      return data.map((client): Client => ({
        id: client.id,
        name: client.name,
        phone: client.phone || "",
        paymentDay: client.payment_day || 1,
        marketingInfo: client.marketing_info || "",
        instagram: client.instagram || "",
        facebook: client.facebook || "",
        packages: Array.isArray(client.packages) ? client.packages.map(pkg => ({
          id: typeof pkg === 'object' && pkg !== null ? (pkg.id as string || crypto.randomUUID()) : crypto.randomUUID(),
          name: typeof pkg === 'object' && pkg !== null ? (pkg.name as string || "") : "",
          totalPublications: typeof pkg === 'object' && pkg !== null ? (pkg.totalPublications as number || 0) : 0,
          usedPublications: typeof pkg === 'object' && pkg !== null ? (pkg.usedPublications as number || 0) : 0,
          month: typeof pkg === 'object' && pkg !== null ? (pkg.month as string || "") : "",
          paid: typeof pkg === 'object' && pkg !== null ? (pkg.paid as boolean || false) : false
        })) : [],
        clientInfo: typeof client.client_info === 'object' && client.client_info !== null ? {
          generalInfo: (client.client_info as any).generalInfo || "",
          meetings: Array.isArray((client.client_info as any).meetings) ? (client.client_info as any).meetings : [],
          socialNetworks: Array.isArray((client.client_info as any).socialNetworks) ? (client.client_info as any).socialNetworks : []
        } : {
          generalInfo: "",
          meetings: [],
          socialNetworks: []
        }
      }));
    },
  });

  return <CalendarView clients={clients} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GoogleOAuthProvider clientId="280195859714-4fgds66d11sbrdb9dem19jv50g7mhsi5.apps.googleusercontent.com">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/calendar" element={<CalendarWrapper />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </GoogleOAuthProvider>
  </QueryClientProvider>
);

export default App;