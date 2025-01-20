import { lazy, Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CalendarView = lazy(() => import("@/components/calendar/CalendarView"));
const UserManagement = lazy(() => import("@/components/settings/UserManagement"));

const Index = () => {
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
    <Suspense fallback={<Spinner />}>
      <div>
        <CalendarView clients={clients} />
        <UserManagement />
      </div>
    </Suspense>
  );
};

export default Index;