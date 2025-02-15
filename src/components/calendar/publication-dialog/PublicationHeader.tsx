
import { LinkIcon, Instagram } from "lucide-react";
import { Client } from "../../types/client";

interface PublicationHeaderProps {
  client?: Client;
}

export const PublicationHeader = ({ client }: PublicationHeaderProps) => {
  if (!client) return null;

  return (
    <div className="space-y-2 mb-4 border-b pb-4">
      {client.clientInfo?.branding && (
        <a 
          href={client.clientInfo.branding} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <LinkIcon className="h-4 w-4" />
          <span className="truncate">Branding</span>
        </a>
      )}
      {client.instagram && (
        <a 
          href={`https://instagram.com/${client.instagram}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300"
        >
          <Instagram className="h-4 w-4" />
          <span className="truncate">@{client.instagram}</span>
        </a>
      )}
    </div>
  );
};
