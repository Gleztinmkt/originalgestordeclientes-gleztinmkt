
import { format } from "date-fns";
import { Trash2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Publication, PublicationNote } from "./types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo, useCallback, memo } from "react";

interface PublicationItemProps {
  publication: Publication;
  onDelete: (id: string) => void;
  onTogglePublished: (id: string, isPublished: boolean) => void;
  onSelect: (publication: Publication) => void;
}

const ADMIN_EMAILS = [
  'agustincarreras266@gmail.com',
  'aloha@gleztin.com',
  'aloha3@gleztin.com.ar',
  'aloha2@gleztin.com.ar'
];

const PublicationItemComponent = ({ 
  publication, 
  onDelete, 
  onTogglePublished,
  onSelect 
}: PublicationItemProps) => {
  // Query to check if user is admin
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
      } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const isAdmin = useMemo(() => 
    currentUser?.email && ADMIN_EMAILS.includes(currentUser.email), 
    [currentUser?.email]
  );

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
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Refresh notes when the component mounts to ensure we have the latest data
  useEffect(() => {
    if (isAdmin) {
      refetchNotes();
    }
  }, [isAdmin, refetchNotes]);

  const hasNotes = useMemo(() => noteData && noteData.length > 0, [noteData]);
  const latestNoteStatus = useMemo(() => hasNotes ? noteData[0]?.status : null, [hasNotes, noteData]);

  const getNoteStatusColor = useCallback(() => {
    if (!latestNoteStatus) return "text-gray-400";
    switch (latestNoteStatus) {
      case "done":
        return "text-green-500";
      case "received":
        return "text-blue-500";
      default:
        return "text-yellow-500";
    }
  }, [latestNoteStatus]);

  const handleToggleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onTogglePublished(publication.id, e.target.checked);
  }, [publication.id, onTogglePublished]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(publication.id);
  }, [publication.id, onDelete]);

  const handleSelect = useCallback(() => {
    onSelect(publication);
  }, [publication, onSelect]);

  const formattedDate = useMemo(() => 
    format(new Date(publication.date), "dd/MM/yyyy"), 
    [publication.date]
  );

  return (
    <div 
      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer"
      onClick={handleSelect}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={publication.is_published}
            onChange={handleToggleChange}
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
          {formattedDate} • {publication.type}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDeleteClick}
        className="text-red-500 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const PublicationItem = memo(PublicationItemComponent);
