import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Publication } from "../client/publication/types";
import { Client } from "../types/client";
import { PublicationDialog } from "./PublicationDialog";
import { cn } from "@/lib/utils";

interface PublicationCardProps {
  publication: Publication;
  client?: Client;
  onUpdate: () => void;
  displayTitle: string;
}

export const PublicationCard = ({ 
  publication, 
  client, 
  onUpdate,
  displayTitle 
}: PublicationCardProps) => {
  const [showDialog, setShowDialog] = useState(false);

  const getStatusColor = () => {
    if (publication.is_published) return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
    if (publication.in_cloud) return "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    if (publication.approved) return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
    if (publication.in_review) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
    if (publication.in_editing) return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100";
    if (publication.needs_editing) return "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100";
    if (publication.needs_recording) return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
  };

  return (
    <>
      <Card 
        className={cn(
          "mb-1 hover:shadow-md transition-shadow cursor-pointer",
          getStatusColor()
        )}
        onClick={() => setShowDialog(true)}
      >
        <CardContent className="p-2">
          <p className="text-sm font-medium truncate">
            {displayTitle}
          </p>
          {publication.designer && (
            <p className="text-xs opacity-75 truncate">
              Diseñador: {publication.designer}
            </p>
          )}
        </CardContent>
      </Card>

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