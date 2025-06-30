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
  User,
  Instagram,
  MessageCircle,
  StickyNote
} from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { PublicationNoteDialog } from "./PublicationNoteDialog";
import { PublicationNoteView } from "./PublicationNoteView";

interface PublicationCardProps {
  publication: Publication;
  client?: Client;
  onUpdate: () => void;
  displayTitle: string;
  designers?: any[];
  isMobile?: boolean;
}

const ADMIN_EMAILS = [
  'agustincarreras266@gmail.com',
  'aloha@gleztin.com',
  'aloha3@gleztin.com.ar',
  'aloha2@gleztin.com.ar'
];

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
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showNoteView, setShowNoteView] = useState(false);
  const [editNoteId, setEditNoteId] = useState<string | undefined>(undefined);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const isAdmin = currentUser?.email && ADMIN_EMAILS.includes(currentUser.email);

  const { data: noteData, refetch: refetchNotes } = useQuery({
    queryKey: ['publicationNotes', publication.id],
    queryFn: async () => {
      if (!isAdmin) return null;
      
      const { data, error } = await supabase
        .from('publication_notes')
        .select('*')
        .eq('publication_id', publication.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const hasNotes = noteData && noteData.length > 0;
  
  const latestNoteStatus = hasNotes ? noteData[0]?.status : null;

  const getNoteStatusColor = () => {
    if (!latestNoteStatus) return "text-gray-400";
    switch (latestNoteStatus) {
      case "done":
        return "text-green-500";
      case "received":
        return "text-blue-500";
      default:
        return "text-yellow-500";
    }
  };

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
      const { data: pub, error: fetchError } = await supabase
        .from('publications')
        .select('name')
        .eq('id', publication.id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching publication for deletion:', fetchError);
        throw fetchError;
      }
      
      const { error: updateError } = await supabase
        .from('publications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', publication.id);

      if (updateError) throw updateError;
      
      const { error: insertError } = await supabase
        .from('deleted_items')
        .insert({
          type: 'publication',
          id: publication.id,
          content: pub.name,
          deleted_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error saving publication to deleted_items:', insertError);
      }

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

  const handleAddNote = () => {
    setEditNoteId(undefined);
    setShowNoteView(false);
    setTimeout(() => {
      setShowNoteDialog(true);
    }, 50);
  };

  const handleViewNotes = () => {
    setShowNoteDialog(false);
    setTimeout(() => {
      setShowNoteView(true);
    }, 50);
  };

  const handleEditNote = (noteId: string) => {
    setEditNoteId(noteId);
    setShowNoteDialog(true);
    setShowNoteView(false);
  };

  const handleNoteSuccess = () => {
    setTimeout(() => {
      refetchNotes();
    }, 50);
  };

  return (
    <>
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
                <div className="flex items-start gap-1 min-w-0">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon()}
                  </div>
                  <p className={cn(
                    "text-xs font-medium",
                    isMobile ? "truncate" : "line-clamp-3"
                  )}>
                    {displayTitle}
                  </p>
                  {isAdmin && hasNotes && (
                    <div className="flex-shrink-0 ml-auto">
                      <StickyNote className={`h-3 w-3 ${getNoteStatusColor()}`} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {publication.designer && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="text-xs truncate">{publication.designer}</span>
                    </div>
                  )}
                  {client?.instagram && (
                    <a 
                      href={`https://instagram.com/${client.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Instagram className="h-3 w-3" />
                      <span className="text-xs truncate">@{client.instagram}</span>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-64">
          {isAdmin && (
            <>
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
              
              <ContextMenuItem onClick={handleAddNote}>
                <MessageCircle className="mr-2 h-4 w-4" />
                <span>Agregar nota</span>
              </ContextMenuItem>
              
              <ContextMenuItem onClick={handleViewNotes}>
                <StickyNote className="mr-2 h-4 w-4" />
                <span>Ver notas {hasNotes ? `(${noteData?.length})` : ""}</span>
              </ContextMenuItem>
              
              <ContextMenuSeparator />
            </>
          )}

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
      </ContextMenu>

      <PublicationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        publication={publication}
        client={client}
        onUpdate={onUpdate}
        onDelete={handleDelete}
        designers={designers}
      />

      {isAdmin && (
        <>
          <PublicationNoteDialog
            publicationId={publication.id}
            noteId={editNoteId}
            open={showNoteDialog}
            onOpenChange={(open) => {
              setShowNoteDialog(open);
              if (!open) {
                setEditNoteId(undefined);
              }
            }}
            onSuccess={handleNoteSuccess}
          />

          <PublicationNoteView
            publicationId={publication.id}
            open={showNoteView}
            onOpenChange={setShowNoteView}
            onEdit={handleEditNote}
            onSuccess={handleNoteSuccess}
          />
        </>
      )}
    </>
  );
};
