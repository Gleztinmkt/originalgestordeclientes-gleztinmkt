
import { format } from "date-fns";
import { Trash2, StickyNote, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Publication, PublicationNote } from "./types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface PublicationItemProps {
  publication: Publication;
  onDelete: (id: string) => void;
  onTogglePublished: (id: string, isPublished: boolean) => void;
  onSelect: (publication: Publication) => void;
  onEdit: (publication: Publication) => void;
}

export const PublicationItem = ({ 
  publication, 
  onDelete, 
  onTogglePublished,
  onSelect,
  onEdit
}: PublicationItemProps) => {
  // Query to check if user is admin
  const { data: userRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        return roleData?.role || null;
      } catch (error) {
        console.error("Error fetching user role:", error);
        return null;
      }
    },
  });

  const isAdmin = userRole === 'admin';

  // Query for notes
  const { data: noteData, refetch: refetchNotes } = useQuery({
    queryKey: ['publicationItemNotes', publication.id],
    queryFn: async () => {
      if (!isAdmin) return null;
      
      try {
        const { data, error } = await supabase
          .from('publication_notes')
          .select('*')
          .eq('publication_id', publication.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Ensure each note has a valid status
        const typedNotes: PublicationNote[] = (data || []).map(note => {
          let validStatus: "new" | "done" | "received" = "new";
          if (note.status === "new" || note.status === "done" || note.status === "received") {
            validStatus = note.status as "new" | "done" | "received";
          }
          
          return {
            ...note,
            status: validStatus
          };
        });
        
        return typedNotes;
      } catch (error) {
        console.error("Error fetching notes:", error);
        return [];
      }
    },
    enabled: isAdmin,
  });

  // Refresh notes when the component mounts to ensure we have the latest data
  useEffect(() => {
    if (isAdmin) {
      refetchNotes();
    }
  }, [isAdmin, refetchNotes]);

  const hasNotes = noteData && noteData.length > 0;
  
  // Get the latest note status for the icon color
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
          {isAdmin && hasNotes && (
            <StickyNote className={cn("h-4 w-4", getNoteStatusColor())} />
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {format(new Date(publication.date), "dd/MM/yyyy")} • {publication.type}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(publication);
          }}
          className="text-blue-500 hover:text-blue-700"
        >
          <Pencil className="h-4 w-4" />
        </Button>
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
    </div>
  );
};
