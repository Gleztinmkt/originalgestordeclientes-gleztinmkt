
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
  const safePublications = useMemo(() => 
    Array.isArray(publications) ? publications : [], 
    [publications]
  );
  
  const filteredPublications = useMemo(() => 
    packageId 
      ? safePublications.filter(pub => pub.package_id === packageId)
      : safePublications,
    [safePublications, packageId]
  );

  const sortedPublications = useMemo(() =>
    [...filteredPublications].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [filteredPublications]
  );

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
        {sortedPublications.map((pub) => (
          <PublicationListItem key={pub.id} publication={pub} />
        ))}
      </div>
    </ScrollArea>
  );
};

const PublicationListItem = memo(({ publication }: { publication: Publication }) => {
  const formattedDate = useMemo(() => 
    format(new Date(publication.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }),
    [publication.date]
  );

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
        {getTypeIcon(publication.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm truncate">{publication.name}</h4>
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
