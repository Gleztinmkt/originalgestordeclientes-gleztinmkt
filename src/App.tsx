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

      return data.map((client): Client => {
        // Ensure packages is an array and transform each package
        const packages = Array.isArray(client.packages) 
          ? client.packages.map((pkg: any) => ({
              id: typeof pkg.id === 'string' ? pkg.id : crypto.randomUUID(),
              name: typeof pkg.name === 'string' ? pkg.name : "",
              totalPublications: typeof pkg.totalPublications === 'number' ? pkg.totalPublications : 0,
              usedPublications: typeof pkg.usedPublications === 'number' ? pkg.usedPublications : 0,
              month: typeof pkg.month === 'string' ? pkg.month : "",
              paid: typeof pkg.paid === 'boolean' ? pkg.paid : false
            }))
          : [];

        // Transform client_info with proper type checking
        const clientInfo = typeof client.client_info === 'object' && client.client_info !== null
          ? {
              generalInfo: typeof (client.client_info as any).generalInfo === 'string' 
                ? (client.client_info as any).generalInfo 
                : "",
              meetings: Array.isArray((client.client_info as any).meetings) 
                ? (client.client_info as any).meetings 
                : [],
              socialNetworks: Array.isArray((client.client_info as any).socialNetworks) 
                ? (client.client_info as any).socialNetworks 
                : []
            }
          : {
              generalInfo: "",
              meetings: [],
              socialNetworks: []
            };

        return {
          id: client.id,
          name: client.name,
          phone: client.phone || "",
          paymentDay: client.payment_day || 1,
          marketingInfo: client.marketing_info || "",
          instagram: client.instagram || "",
          facebook: client.facebook || "",
          packages,
          clientInfo
        };
      });
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