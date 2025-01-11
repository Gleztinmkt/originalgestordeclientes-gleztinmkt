import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Publication } from "../client/publication/types";
import { Client } from "../types/client";
import { PublicationDialog } from "./PublicationDialog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface PublicationCardProps {
  publication: Publication;
  client?: Client;
  onUpdate: () => void;
  displayTitle: string;
  onStatusChange?: (publicationId: string, status: string) => void;
}

export const PublicationCard = ({ 
  publication, 
  client, 
  onUpdate,
  displayTitle,
  onStatusChange 
}: PublicationCardProps) => {
  const [showDialog, setShowDialog] = useState(false);

  const getStatusColor = () => {
    if (publication.is_published) return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
    if (publication.approved) return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
    if (publication.in_review) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
    if (publication.in_editing) return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100";
    if (publication.needs_editing) return "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100";
    if (publication.needs_recording) return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
  };

  const handleStatusChange = (status: string) => {
    if (onStatusChange) {
      onStatusChange(publication.id, status);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <Card 
            className={cn(
              "mb-1 hover:shadow-md transition-shadow cursor-pointer group p-2",
              getStatusColor()
            )}
            onClick={() => setShowDialog(true)}
          >
            <CardContent className="p-0">
              <div className="space-y-1">
                <p className="text-xs font-medium line-clamp-2">
                  {displayTitle}
                </p>
                {publication.designer && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 whitespace-nowrap w-full">
                    <User className="h-2 w-2 mr-1" />
                    {publication.designer}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => handleStatusChange('needs_recording')}>
            Falta grabar
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleStatusChange('needs_editing')}>
            Falta editar
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleStatusChange('in_editing')}>
            En edición
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleStatusChange('in_review')}>
            En revisión
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleStatusChange('approved')}>
            Aprobado
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleStatusChange('published')}>
            Publicado
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <PublicationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        publication={publication}
        client={client}
        onUpdate={onUpdate}
      />
    </>
  );
};