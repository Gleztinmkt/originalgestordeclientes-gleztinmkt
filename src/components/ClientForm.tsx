import { useState } from "react";
import { UserPlus, FolderOpen, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { BasicClientForm, BasicFormValues } from "./client/BasicClientForm";
import { toast } from "@/hooks/use-toast";
import { Client } from "@/components/types/client";

interface ClientFormProps {
  onAddClient: (client: any) => Promise<Client | null>;
  onUpdateClient?: (id: string, data: Partial<Client>) => Promise<void>;
}

type DriveStatus = "idle" | "loading" | "success" | "error";

export const ClientForm = ({ onAddClient, onUpdateClient }: ClientFormProps) => {
  const [open, setOpen] = useState(false);
  const [createdClient, setCreatedClient] = useState<Client | null>(null);
  const [driveStatus, setDriveStatus] = useState<DriveStatus>("idle");
  const [driveUrl, setDriveUrl] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  const resetState = () => {
    setCreatedClient(null);
    setDriveStatus("idle");
    setDriveUrl(null);
    setDriveError(null);
  };

  const onSubmit = async (values: BasicFormValues) => {
    const newClient = {
      name: values.name,
      phone: values.phone,
      payment_day: parseInt(values.nextPayment.toString()),
      marketingInfo: "",
      instagram: "",
      facebook: "",
      packages: []
    };

    const result = await onAddClient(newClient);
    if (result) {
      setCreatedClient(result);
    } else {
      setOpen(false);
      resetState();
    }
  };

  const handleCreateDriveFolders = async () => {
    if (!createdClient) return;

    setDriveStatus("loading");
    setDriveError(null);

    try {
      const scriptUrl = "https://script.google.com/macros/s/AKfycbwl4AxjUPRrgtpwXE78mXsNqD7Igdk-ghnRVdsbjBXB4YNUPGB-x3_dY2SKAETwVdhOOA/exec";

      const response = await fetch(scriptUrl, {
        method: "POST",
        body: JSON.stringify({ nombreCliente: createdClient.name }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || "Error al crear carpetas");
      }

      setDriveUrl(data.url);
      setDriveStatus("success");

      // Save branding, material, general URLs to client
      if (onUpdateClient && (data.urlBranding || data.urlMaterial || data.urlGeneral)) {
        await onUpdateClient(createdClient.id, {
          clientInfo: {
            ...createdClient.clientInfo,
            generalInfo: createdClient.clientInfo?.generalInfo || "",
            meetings: createdClient.clientInfo?.meetings || [],
            socialNetworks: createdClient.clientInfo?.socialNetworks || [],
            publicationSchedule: createdClient.clientInfo?.publicationSchedule || [],
            ...(data.urlBranding && { branding: data.urlBranding }),
            ...(data.urlMaterial && { material: data.urlMaterial }),
            ...(data.urlGeneral && { general: data.urlGeneral }),
          },
        });
      }
    } catch (err: any) {
      console.error("Error creating Drive folders:", err);
      setDriveError(err.message || "Error desconocido");
      setDriveStatus("error");
    }
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="w-full bg-black hover:bg-gray-900 text-white rounded-2xl py-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <UserPlus className="mr-2 h-5 w-5" />
          Agregar Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-card border-0">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-semibold text-gray-800">
            {createdClient ? "Cliente creado" : "Nuevo Cliente"}
          </DialogTitle>
        </DialogHeader>

        {!createdClient ? (
          <BasicClientForm onSubmit={onSubmit} />
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              <strong>{createdClient.name}</strong> se creó correctamente.
            </p>

            {driveStatus === "idle" && (
              <Button
                onClick={handleCreateDriveFolders}
                variant="outline"
                className="w-full"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                📁 Crear carpetas en Drive
              </Button>
            )}

            {driveStatus === "loading" && (
              <Button disabled variant="outline" className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando carpetas...
              </Button>
            )}

            {driveStatus === "success" && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg p-3">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Carpetas creadas</span>
                {driveUrl && (
                  <a
                    href={driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto font-medium underline hover:text-green-700"
                  >
                    Abrir en Drive →
                  </a>
                )}
              </div>
            )}

            {driveStatus === "error" && driveError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{driveError}</span>
              </div>
            )}

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => handleClose(false)}
            >
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
