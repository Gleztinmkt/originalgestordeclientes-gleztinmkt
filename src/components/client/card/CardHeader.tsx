
import { CardHeader as UICardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ClientInfoDialog } from "../ClientInfoDialog";
import { EditClientDialog } from "../EditClientDialog";
import { AddPackageDialog } from "../AddPackageDialog";
import { Client, ClientInfo } from "../../types/client";

interface CardHeaderProps {
  client: Client;
  viewMode: "list" | "grid";
  onUpdateClientInfo: (clientId: string, info: ClientInfo) => Promise<void>;
  onDeleteClient: () => void;
  onUpdateClient: (id: string, data: Partial<Client>) => Promise<void>;
  onAddPackage: (clientId: string, packageData: any) => Promise<void>;
  isExpanded: boolean;
  onClose: () => void;
}

export const ClientCardHeader = ({
  client,
  viewMode,
  onUpdateClientInfo,
  onDeleteClient,
  onUpdateClient,
  onAddPackage,
  isExpanded,
  onClose,
}: CardHeaderProps) => {
  return (
    <UICardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
      <CardTitle className="text-xl font-heading font-semibold text-gray-800 dark:text-white">
        {client.name}
      </CardTitle>
      <div className="flex gap-2">
        <ClientInfoDialog
          clientId={client.id}
          clientInfo={client.clientInfo}
          onUpdateInfo={onUpdateClientInfo}
        />
        <EditClientDialog 
          client={client}
          onUpdateClient={onUpdateClient}
          onDeleteClient={onDeleteClient}
        />
        <AddPackageDialog
          clientId={client.id}
          onAddPackage={onAddPackage}
        />
        {viewMode === "grid" && isExpanded && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </UICardHeader>
  );
};
