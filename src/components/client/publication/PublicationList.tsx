import { ScrollArea } from "@/components/ui/scroll-area";
import { Publication } from "./types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PublicationListProps } from "./types";

export const PublicationList = ({ 
  clientId, 
  onSelect, 
  onTogglePublished,
  packageId 
}: PublicationListProps) => {
  const filteredPublications = packageId 
    ? publications.filter(pub => pub.package_id === packageId)
    : publications;

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
            className="flex items-start space-x-4 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
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
                <p className="text-sm text-gray-600 dark:text-gray-300">
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