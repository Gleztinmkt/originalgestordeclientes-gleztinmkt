
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
  // Defensive validation
  if (!publication || !publication.id) {
    console.warn('PublicationItem: Invalid publication prop');
    return null;
  }

  // Query to check if user is admin with error handling
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error fetching current user:", error);
          return null;
        }
        return user;
      } catch (error) {
        console.error("Error in user query:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      console.warn(`User query failed ${failureCount} times:`, error);
      return failureCount < 2; // Only retry once
    }
  });

  const isAdmin = useMemo(() => 
    currentUser?.email && ADMIN_EMAILS.includes(currentUser.email), 
    [currentUser?.email]
  );

  // Query for notes with defensive programming
  const { data: noteData, refetch: refetchNotes } = useQuery({
    queryKey: ['publicationItemNotes', publication.id],
    queryFn: async () => {
      if (!isAdmin || !publication?.id) return [];
      
      try {
        const { data, error } = await supabase
          .from('publication_notes')
          .select('*')
          .eq('publication_id', publication.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching notes:", error);
          return [];
        }
        
        // Defensive validation and type conversion
        if (!Array.isArray(data)) {
          console.warn("Notes data is not an array:", data);
          return [];
        }
        
        const typedNotes: PublicationNote[] = data.map(note => {
          if (!note || typeof note !== 'object') {
            console.warn("Invalid note object:", note);
            return null;
          }
          
          let validStatus: "new" | "done" | "received" = "new";
          if (note.status === "new" || note.status === "done" || note.status === "received") {
            validStatus = note.status as "new" | "done" | "received";
          }
          
          return {
            ...note,
            status: validStatus
          };
        }).filter(note => note !== null);
        
        return typedNotes;
      } catch (error) {
        console.error("Error in notes query:", error);
        return [];
      }
    },
    enabled: Boolean(isAdmin && publication?.id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      console.warn(`Notes query failed ${failureCount} times:`, error);
      return failureCount < 2;
    }
  });

  // Refresh notes when the component mounts to ensure we have the latest data
  useEffect(() => {
    if (isAdmin && publication?.id && refetchNotes) {
      refetchNotes().catch(error => {
        console.error("Error refetching notes:", error);
      });
    }
  }, [isAdmin, publication?.id, refetchNotes]);

  const hasNotes = useMemo(() => {
    return Array.isArray(noteData) && noteData.length > 0;
  }, [noteData]);
  
  const latestNoteStatus = useMemo(() => {
    if (!hasNotes || !Array.isArray(noteData) || noteData.length === 0) return null;
    return noteData[0]?.status || null;
  }, [hasNotes, noteData]);

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
    try {
      e.stopPropagation();
      if (publication?.id && onTogglePublished) {
        onTogglePublished(publication.id, e.target.checked);
      }
    } catch (error) {
      console.error("Error in toggle change:", error);
    }
  }, [publication?.id, onTogglePublished]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    try {
      e.stopPropagation();
      if (publication?.id && onDelete) {
        onDelete(publication.id);
      }
    } catch (error) {
      console.error("Error in delete click:", error);
    }
  }, [publication?.id, onDelete]);

  const handleSelect = useCallback(() => {
    try {
      if (publication && onSelect) {
        onSelect(publication);
      }
    } catch (error) {
      console.error("Error in select:", error);
    }
  }, [publication, onSelect]);

  const formattedDate = useMemo(() => {
    try {
      if (!publication?.date) return 'Sin fecha';
      const date = new Date(publication.date);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date for publication:', publication.id, publication.date);
        return 'Fecha inválida';
      }
      return format(date, "dd/MM/yyyy");
    } catch (error) {
      console.error("Error formatting date:", error, publication?.date);
      return 'Error en fecha';
    }
  }, [publication?.date]);

  return (
    <div 
      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer"
      onClick={handleSelect}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(publication?.is_published)}
            onChange={handleToggleChange}
            className="h-4 w-4 rounded border-gray-300"
          />
          <p className="font-medium dark:text-white">
            {publication?.name || 'Sin nombre'}
          </p>
          {isAdmin && hasNotes && (
            <StickyNote className={cn("h-4 w-4", getNoteStatusColor())} />
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formattedDate} • {publication?.type || 'Sin tipo'}
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
