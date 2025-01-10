import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Publication } from "../client/publication/types";
import { Client } from "../types/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PublicationDialog } from "./PublicationDialog";
import { Camera, Edit, CheckCircle, AlertCircle, Upload, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicationCardProps {
  publication: Publication;
  client?: Client;
  onUpdate: () => void;
}

export const PublicationCard = ({ publication, client, onUpdate }: PublicationCardProps) => {
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

  return (
    <>
      <Card className={cn("hover:shadow-lg transition-shadow", getStatusColor())}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold">
                {publication.name}
              </CardTitle>
              <p className="text-sm opacity-90">
                {client?.name} - {format(new Date(publication.date), "PPP", { locale: es })}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowDialog(true)}>
              Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {publication.needs_recording && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Camera className="h-3 w-3" /> Grabar
              </Badge>
            )}
            {publication.needs_editing && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Edit className="h-3 w-3" /> Editar
              </Badge>
            )}
            {publication.in_editing && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Edit className="h-3 w-3" /> En edición
              </Badge>
            )}
            {publication.in_review && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> En revisión
              </Badge>
            )}
            {publication.approved && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Aprobado
              </Badge>
            )}
            {publication.is_published && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Upload className="h-3 w-3" /> Publicado
              </Badge>
            )}
            {publication.designer && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <User className="h-3 w-3" /> {publication.designer}
              </Badge>
            )}
          </div>
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