import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "./components/ui/toaster";
import { Spinner } from "./components/ui/spinner";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/components/types/client";

const CalendarView = lazy(() => import("@/components/calendar/CalendarView"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 5,
      staleTime: 1000 * 60 * 5
    },
  },
});

function AppContent() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('deleted_at', null);
      
      if (error) throw error;
      
      return (data || []).map((client): Client => ({
        id: client.id,
        name: client.name,
        phone: client.phone || "",
        paymentDay: client.payment_day || 1,
        marketingInfo: client.marketing_info || "",
        instagram: client.instagram || "",
        facebook: client.facebook || "",
        packages: Array.isArray(client.packages) ? client.packages.map(pkg => ({
          id: String(pkg.id || crypto.randomUUID()),
          name: String(pkg.name || ""),
          totalPublications: Number(pkg.totalPublications) || 0,
          usedPublications: Number(pkg.usedPublications) || 0,
          month: String(pkg.month || ""),
          paid: Boolean(pkg.paid)
        })) : [],
        clientInfo: client.client_info ? {
          generalInfo: String(client.client_info.generalInfo || ""),
          meetings: Array.isArray(client.client_info.meetings) ? client.client_info.meetings : [],
          socialNetworks: Array.isArray(client.client_info.socialNetworks) ? client.client_info.socialNetworks : []
        } : {
          generalInfo: "",
          meetings: [],
          socialNetworks: []
        }
      }));
    },
  });

  return (
    <ThemeProvider>
      <Suspense fallback={<Spinner />}>
        <CalendarView clients={clients} />
      </Suspense>
      <Toaster />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}