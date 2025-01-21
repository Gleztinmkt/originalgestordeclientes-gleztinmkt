import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ClientViewer } from "@/components/client/viewer/ClientViewer";
import { supabase } from "@/integrations/supabase/client";

const ClientView = () => {
  const [searchParams] = useSearchParams();
  const clientLinkId = searchParams.get("id");

  useEffect(() => {
    const setClientLink = async () => {
      if (!clientLinkId) return;
      
      const { data: linkData, error: linkError } = await supabase
        .from('client_links')
        .select('client_id')
        .eq('unique_id', clientLinkId)
        .eq('is_active', true)
        .single();

      if (linkError || !linkData) {
        console.error('Error fetching client link:', linkError);
        return;
      }

      await supabase.rpc('is_super_admin');
    };

    setClientLink();
  }, [clientLinkId]);

  if (!clientLinkId) {
    return <div>Link inválido</div>;
  }

  return <ClientViewer />;
};

export default ClientView;