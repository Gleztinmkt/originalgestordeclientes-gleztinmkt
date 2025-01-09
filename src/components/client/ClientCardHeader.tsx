import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, X } from "lucide-react";
import { ClientInfoDialog } from "./ClientInfoDialog";
import { PublicationCalendarDialog } from "./PublicationCalendarDialog";
import { EditClientDialog } from "./EditClientDialog";
import { AddPackageDialog } from "./AddPackageDialog";
import { Client, ClientInfo } from "../types/client";

interface ClientCardHeaderProps {
  client: Client;
  viewMode: "list" | "grid";
  onUpdateClientInfo: (clientId: string, info: ClientInfo) => void;
  onUpdateClient: (id: string, data: any) => void;
  onAddPackage: (clientId: string, packageData: any) => void;
  onShowDeleteDialog: () => void;
  onCloseExpanded: () => void;
}

export const ClientCardHeader = ({
  client,
  viewMode,
  onUpdateClientInfo,
  onUpdateClient,
  onAddPackage,
  onShowDeleteDialog,
  onCloseExpanded
}: ClientCardHeaderProps) => {
  return (
    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
      <CardTitle className="text-xl font-heading font-semibold text-gray-800 dark:text-white">
        {client.name}
      </CardTitle>
      <div className="flex gap-2">
        <ClientInfoDialog
          clientId={client.id}
          clientInfo={client.clientInfo}
          onUpdateInfo={onUpdateClientInfo}
        />
        <PublicationCalendarDialog 
          clientId={client.id}
          clientName={client.name}
        />
        <EditClientDialog 
          client={client}
          onUpdateClient={onUpdateClient}
        />
        <AddPackageDialog
          clientId={client.id}
          onAddPackage={onAddPackage}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowDeleteDialog}
          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        {viewMode === "grid" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onCloseExpanded();
            }}
            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </CardHeader>
  );
};