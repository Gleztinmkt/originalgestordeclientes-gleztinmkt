import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Publication, PublicationType } from "./types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PublicationListProps } from "./types";
import { supabase } from "@/integrations/supabase/client";

export const PublicationList = ({ 
  clientId, 
  onSelect, 
  onTogglePublished,
  packageId 
}: PublicationListProps) => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        let query = supabase
          .from('publications')
          .select('*')
          .eq('client_id', clientId)
          .is('deleted_at', null);
        
        if (packageId) {
          query = query.eq('package_id', packageId);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        // Validate and type cast the data to ensure type is a valid PublicationType
        const typedPublications: Publication[] = (data || []).map(pub => {
          // Extract only the fields we need for the Publication type
          const publication: Publication = {
            id: pub.id,
            client_id: pub.client_id || undefined,
            name: pub.name,
            type: validatePublicationType(pub.type),
            date: pub.date,
            description: pub.description || undefined,
            google_calendar_event_id: pub.google_calendar_event_id || undefined,
            package_id: pub.package_id || undefined,
            is_published: pub.is_published || false
          };
          return publication;
        });

        setPublications(typedPublications);
      } catch (error) {
        console.error('Error fetching publications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublications();
  }, [clientId, packageId]);

  // Helper function to validate PublicationType
  const validatePublicationType = (type: string): PublicationType => {
    if (['reel', 'carousel', 'image'].includes(type)) {
      return type as PublicationType;
    }
    console.warn(`Invalid publication type: ${type}, defaulting to 'image'`);
    return 'image';
  };

  if (isLoading) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        Cargando publicaciones...
      </div>
    );
  }

  if (publications.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        No hay publicaciones programadas
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px] rounded-md border p-4">
      <div className="space-y-4">
        {publications.map((pub) => (
          <div
            key={pub.id}
            className="flex items-start space-x-4 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm cursor-pointer hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
            onClick={() => onSelect(pub)}
          >
            <div className="flex-1 space-y-1">
              <h4 className="font-medium">{pub.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(pub.date), "PPP", { locale: es })}
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                  {pub.type}
                </span>
                <input
                  type="checkbox"
                  checked={pub.is_published}
                  onChange={(e) => {
                    e.stopPropagation();
                    onTogglePublished(pub.id, e.target.checked);
                  }}
                  className="ml-2"
                />
              </div>
              {pub.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {pub.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};