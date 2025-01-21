import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClientViewer } from "@/components/client/viewer/ClientViewer";
import { supabase } from "@/integrations/supabase/client";

const ClientView = () => {
  const [searchParams] = useSearchParams();
  const [isValidLink, setIsValidLink] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateLink = async () => {
      const linkId = searchParams.get('id');
      if (!linkId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('client_links')
          .select('client_id')
          .eq('unique_id', linkId)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        if (data) {
          setClientId(data.client_id);
          setIsValidLink(true);
          
          // Set the client link in Postgres settings for RLS
          await supabase.rpc('set_request_setting', {
            setting_name: 'app.current_client_link',
            setting_value: linkId
          });
        }
      } catch (error) {
        console.error('Error validating link:', error);
      } finally {
        setIsLoading(false);
      }
    };

    validateLink();
  }, [searchParams]);

  if (isLoading) {
    return <div className="p-8 text-center">Validando enlace...</div>;
  }

  if (!isValidLink || !clientId) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">Enlace inválido</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          El enlace que intentas acceder no es válido o ha expirado.
        </p>
      </div>
    );
  }

  return <ClientViewer clientId={clientId} />;
};

export default ClientView;