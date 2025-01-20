import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/components/types/client";
import { lazy, Suspense } from "react";

const CalendarView = lazy(() => import("@/components/calendar/CalendarView"));

function IndexContent() {
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
        packages: Array.isArray(client.packages) ? (client.packages as any[]).map(pkg => ({
          id: String(pkg.id || crypto.randomUUID()),
          name: String(pkg.name || ""),
          totalPublications: Number(pkg.totalPublications) || 0,
          usedPublications: Number(pkg.usedPublications) || 0,
          month: String(pkg.month || ""),
          paid: Boolean(pkg.paid)
        })) : [],
        clientInfo: client.client_info ? {
          generalInfo: String((client.client_info as any)?.generalInfo || ""),
          meetings: Array.isArray((client.client_info as any)?.meetings) ? (client.client_info as any).meetings : [],
          socialNetworks: Array.isArray((client.client_info as any)?.socialNetworks) ? (client.client_info as any).socialNetworks : []
        } : {
          generalInfo: "",
          meetings: [],
          socialNetworks: []
        }
      }));
    },
  });

  return (
    <Suspense fallback={<Spinner />}>
      <CalendarView clients={clients} />
    </Suspense>
  );
}

export default function Index() {
  return <IndexContent />;
}