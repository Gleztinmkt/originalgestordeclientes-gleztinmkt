import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Publication } from "./types";

interface PublicationItemProps {
  publication: Publication;
  onDelete: (id: string) => void;
  onTogglePublished: (id: string, isPublished: boolean) => void;
  onSelect: (publication: Publication) => void;
}

export const PublicationItem = ({ 
  publication, 
  onDelete, 
  onTogglePublished,
  onSelect 
}: PublicationItemProps) => {
  return (
    <div 
      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer"
      onClick={() => onSelect(publication)}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={publication.is_published}
            onChange={(e) => {
              e.stopPropagation();
              onTogglePublished(publication.id, e.target.checked);
            }}
            className="h-4 w-4 rounded border-gray-300"
          />
          <p className="font-medium dark:text-white">
            {publication.name}
          </p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {format(new Date(publication.date), "dd/MM/yyyy")} • {publication.type}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(publication.id);
        }}
        className="text-red-500 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};