import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "./components/ui/toaster";
import { Spinner } from "./components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./integrations/supabase/client";

const CalendarView = lazy(() => import("./components/calendar/CalendarView"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 5, // 5 minutes
      staleTime: 1000 * 60 * 5,
    },
  },
});

function App() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('deleted_at', null);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Suspense fallback={<Spinner />}>
          <CalendarView clients={clients} />
        </Suspense>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;