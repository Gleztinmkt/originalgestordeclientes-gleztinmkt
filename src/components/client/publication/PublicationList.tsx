import { ScrollArea } from "@/components/ui/scroll-area";
import { Publication } from "./types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PublicationListProps {
  publications: Publication[];
  packageId?: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'reel':
      return '📹';
    case 'carousel':
      return '🎠';
    case 'image':
      return '🖼️';
    default:
      return '';
  }
};

export const PublicationList = ({ publications = [], packageId }: PublicationListProps) => {
  const safePublications = Array.isArray(publications) ? publications : [];
  
  const filteredPublications = packageId 
    ? safePublications.filter(pub => pub.package_id === packageId)
    : safePublications;

  if (filteredPublications.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        No hay publicaciones programadas
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px] rounded-md border p-4">
      <div className="space-y-4">
        {filteredPublications.map((pub) => (
          <div
            key={pub.id}
            className="flex items-start space-x-4 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-200"
          >
            <div className="flex-shrink-0 text-2xl">
              {getTypeIcon(pub.type)}
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="font-medium text-lg">{pub.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(pub.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
              {pub.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                  {pub.description}
                </p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                {pub.is_published ? (
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
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};