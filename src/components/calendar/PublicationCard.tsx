import { Publication } from "../client/publication/types";
import { Client } from "../types/client";
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
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PublicationCardProps {
  publication: Publication;
  client?: Client;
  onUpdate: () => void;
  displayTitle: string;
  designers: any[];
  onAssignDesigner: (publicationId: string, designerName: string | null) => Promise<void>;
}

export const PublicationCard = ({
  publication,
  client,
  onUpdate,
  displayTitle,
  designers,
  onAssignDesigner
}: PublicationCardProps) => {
  const handleStatusChange = async (field: string) => {
    try {
      const { error } = await supabase
        .from('publications')
        .update({ [field]: !publication[field as keyof Publication] })
        .eq('id', publication.id);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: "El estado de la publicación ha sido actualizado.",
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

  const getStatusColor = () => {
    if (publication.is_published) return "bg-green-500";
    if (publication.approved) return "bg-blue-500";
    if (publication.in_review) return "bg-yellow-500";
    if (publication.in_editing) return "bg-purple-500";
    if (publication.needs_editing) return "bg-orange-500";
    if (publication.needs_recording) return "bg-red-500";
    return "bg-gray-500";
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "p-1 rounded text-xs text-left truncate border shadow-sm",
            getStatusColor(),
            "text-white hover:opacity-90 transition-opacity cursor-pointer"
          )}
        >
          <div className="truncate">{displayTitle}</div>
          {publication.designer && (
            <div className="text-xs opacity-75 truncate">
              Diseñador: {publication.designer}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem
          onClick={() => handleStatusChange('needs_recording')}
          className={publication.needs_recording ? 'bg-accent' : ''}
        >
          {publication.needs_recording ? '✓ ' : ''}Falta grabar
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => handleStatusChange('needs_editing')}
          className={publication.needs_editing ? 'bg-accent' : ''}
        >
          {publication.needs_editing ? '✓ ' : ''}Falta editar
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => handleStatusChange('in_editing')}
          className={publication.in_editing ? 'bg-accent' : ''}
        >
          {publication.in_editing ? '✓ ' : ''}En edición
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => handleStatusChange('in_review')}
          className={publication.in_review ? 'bg-accent' : ''}
        >
          {publication.in_review ? '✓ ' : ''}En revisión
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => handleStatusChange('approved')}
          className={publication.approved ? 'bg-accent' : ''}
        >
          {publication.approved ? '✓ ' : ''}Aprobado
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => handleStatusChange('is_published')}
          className={publication.is_published ? 'bg-accent' : ''}
        >
          {publication.is_published ? '✓ ' : ''}Publicado
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            Asignar diseñador
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => onAssignDesigner(publication.id, null)}>
              Sin asignar
            </ContextMenuItem>
            {designers.map((designer) => (
              <ContextMenuItem
                key={designer.id}
                onClick={() => onAssignDesigner(publication.id, designer.name)}
              >
                {designer.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
};