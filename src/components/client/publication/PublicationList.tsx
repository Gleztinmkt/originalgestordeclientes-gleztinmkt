
import { ScrollArea } from "@/components/ui/scroll-area";
import { Publication } from "./types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Video, Image, Layout, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, memo } from "react";

interface PublicationListProps {
  publications: Publication[];
  packageId?: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'reel':
      return <Video className="h-4 w-4" />;
    case 'carousel':
      return <Layout className="h-4 w-4" />;
    case 'image':
      return <Image className="h-4 w-4" />;
    default:
      return null;
  }
};

const getStatusIcon = (publication: Publication) => {
  if (publication.is_published) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  return <Clock className="h-4 w-4 text-yellow-500" />;
};

const PublicationListComponent = ({ publications = [], packageId }: PublicationListProps) => {
  // Defensive validation to prevent freezing
  const safePublications = useMemo(() => {
    if (!Array.isArray(publications)) {
      console.warn('Publications is not an array:', publications);
      return [];
    }
    
    // Validate each publication object
    return publications.filter(pub => {
      if (!pub || typeof pub !== 'object') {
        console.warn('Invalid publication object:', pub);
        return false;
      }
      
      // Ensure required fields exist
      if (!pub.id || !pub.name || !pub.date || !pub.type) {
        console.warn('Publication missing required fields:', pub);
        return false;
      }
      
      return true;
    });
  }, [publications]);
  
  const filteredPublications = useMemo(() => {
    if (!packageId) return safePublications;
    
    return safePublications.filter(pub => {
      try {
        return pub.package_id === packageId;
      } catch (error) {
        console.error('Error filtering publication:', error, pub);
        return false;
      }
    });
  }, [safePublications, packageId]);

  const sortedPublications = useMemo(() => {
    try {
      return [...filteredPublications].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        // Validate dates
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          console.warn('Invalid dates found:', { a: a.date, b: b.date });
          return 0;
        }
        
        return dateA.getTime() - dateB.getTime();
      });
    } catch (error) {
      console.error('Error sorting publications:', error);
      return filteredPublications;
    }
  }, [filteredPublications]);

  if (filteredPublications.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        No hay publicaciones programadas
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] rounded-md border">
      <div className="p-4 space-y-3">
        {sortedPublications.map((pub) => {
          // Additional safety check for each publication
          if (!pub || !pub.id) {
            console.warn('Skipping invalid publication:', pub);
            return null;
          }
          
          return (
            <PublicationListItem key={pub.id} publication={pub} />
          );
        })}
      </div>
    </ScrollArea>
  );
};

const PublicationListItem = memo(({ publication }: { publication: Publication }) => {
  const formattedDate = useMemo(() => {
    try {
      const date = new Date(publication.date);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date for publication:', publication.id, publication.date);
        return 'Fecha inválida';
      }
      return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      console.error('Error formatting date:', error, publication.date);
      return 'Error en fecha';
    }
  }, [publication.date]);

  // Defensive validation
  if (!publication || !publication.id) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors duration-200",
        "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
        "hover:bg-blue-50/50 dark:hover:bg-blue-900/20",
        "border border-gray-100 dark:border-gray-700"
      )}
    >
      <div className="flex-shrink-0">
        {getTypeIcon(publication.type || 'image')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm truncate">{publication.name || 'Sin nombre'}</h4>
          {getStatusIcon(publication)}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formattedDate}
        </p>
        {publication.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
            {publication.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {publication.is_published ? (
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
            Publicado
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">
            Pendiente
          </span>
        )}
      </div>
    </div>
  );
});
PublicationListItem.displayName = 'PublicationListItem';

export const PublicationList = memo(PublicationListComponent);
