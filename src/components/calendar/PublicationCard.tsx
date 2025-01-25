import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Publication } from "../client/publication/types";
import { Client } from "../types/client";
import { PublicationDialog } from "./PublicationDialog";
import { cn } from "@/lib/utils";
import { 
  Video, 
  Edit, 
  CheckCircle2, 
  Upload, 
  AlertCircle,
  Clock,
  User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PublicationCardProps {
  publication: Publication;
  client?: Client;
  onUpdate: () => void;
  displayTitle: string;
  designers?: any[];
  isMobile?: boolean;
}

export const PublicationCard = ({ 
  publication, 
  client, 
  onUpdate,
  displayTitle,
  designers = [],
  isMobile = false
}: PublicationCardProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [touchCount, setTouchCount] = useState(0);
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouch = () => {
    if (isMobile) {
      setTouchCount(prev => prev + 1);
      
      if (touchTimer) {
        clearTimeout(touchTimer);
      }
      
      const timer = setTimeout(() => {
        setTouchCount(0);
      }, 300);
      
      setTouchTimer(timer);
      
      if (touchCount === 1) {
        setShowDialog(true);
        setTouchCount(0);
        if (touchTimer) clearTimeout(touchTimer);
      }
    }
  };

  const getStatusColor = () => {
    if (publication.is_published) return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
    if (publication.approved) return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
    if (publication.in_review) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
    if (publication.in_editing) return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100";
    if (publication.needs_editing) return "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100";
    if (publication.needs_recording) return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
  };

  const getStatusIcon = () => {
    if (publication.is_published) return <Upload className="h-3 w-3" />;
    if (publication.approved) return <CheckCircle2 className="h-3 w-3" />;
    if (publication.in_review) return <AlertCircle className="h-3 w-3" />;
    if (publication.in_editing) return <Edit className="h-3 w-3" />;
    if (publication.needs_editing) return <Edit className="h-3 w-3" />;
    if (publication.needs_recording) return <Video className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
  };

  const handleStatusChange = async (status: string) => {
    try {
      const updates: any = {
        needs_recording: false,
        needs_editing: false,
        in_editing: false,
        in_review: false,
        approved: false,
        is_published: false
      };

      updates[status] = true;

      const { error } = await supabase
        .from('publications')
        .update(updates)
        .eq('id', publication.id);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: "El estado de la publicación ha sido actualizado correctamente.",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating publication status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la publicación.",
        variant: "destructive",
      });
    }
  };

  const handleDesignerAssign = async (designerName: string) => {
    try {
      const { error } = await supabase
        .from('publications')
        .update({ designer: designerName })
        .eq('id', publication.id);

      if (error) throw error;

      toast({
        title: "Diseñador asignado",
        description: "El diseñador ha sido asignado correctamente.",
      });

      onUpdate();
    } catch (error) {
      console.error('Error assigning designer:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el diseñador.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('publications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', publication.id);

      if (error) throw error;

      toast({
        title: "Publicación eliminada",
        description: "La publicación ha sido eliminada correctamente.",
      });

      onUpdate();
      setShowDialog(false);
    } catch (error) {
      console.error('Error deleting publication:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la publicación.",
        variant: "destructive",
      });
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card 
          className={cn(
            "mb-1 hover:shadow-md transition-shadow cursor-pointer group",
            getStatusColor()
          )}
          onClick={isMobile ? handleTouch : () => setShowDialog(true)}
        >
          <CardContent className="p-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 min-w-0">
                {getStatusIcon()}
                <p className="text-xs font-medium truncate">
                  {displayTitle}
                </p>
              </div>
              {publication.designer && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="text-xs truncate">{publication.designer}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-64">
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <User className="mr-2 h-4 w-4" />
            <span>Asignar diseñador</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => handleDesignerAssign("")}>
              Sin diseñador
            </ContextMenuItem>
            <ContextMenuSeparator />
            {designers.map((designer) => (
              <ContextMenuItem
                key={designer.id}
                onClick={() => handleDesignerAssign(designer.name)}
              >
                {designer.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={() => handleStatusChange("needs_recording")}>
          <Video className="mr-2 h-4 w-4" />
          <span>Falta grabar</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleStatusChange("needs_editing")}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Falta editar</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleStatusChange("in_editing")}>
          <Clock className="mr-2 h-4 w-4" />
          <span>En edición</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleStatusChange("in_review")}>
          <AlertCircle className="mr-2 h-4 w-4" />
          <span>En revisión</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleStatusChange("approved")}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          <span>Aprobado</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleStatusChange("is_published")}>
          <Upload className="mr-2 h-4 w-4" />
          <span>Publicado</span>
        </ContextMenuItem>
      </ContextMenuContent>

      <PublicationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        publication={publication}
        client={client}
        onUpdate={onUpdate}
        onDelete={handleDelete}
        designers={designers}
      />
    </ContextMenu>
  );
};