import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Publication } from "./types";
import { Checkbox } from "@/components/ui/checkbox";

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
      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      onClick={() => onSelect(publication)}
    >
      <div className="flex items-center gap-4 flex-1">
        <Checkbox
          checked={publication.is_published}
          onCheckedChange={(checked) => {
            onTogglePublished(publication.id, checked as boolean);
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <div>
          <p className="font-medium dark:text-white">
            {publication.name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(publication.date), "dd/MM/yyyy")} • {publication.type}
          </p>
        </div>
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