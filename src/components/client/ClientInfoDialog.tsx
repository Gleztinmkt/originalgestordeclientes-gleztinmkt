import { useState } from "react";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ClientInfo } from "../types/client";
import { ClientInfoForm } from "@/components/client/ClientInfoForm";

interface ClientInfoDialogProps {
  clientId: string;
  clientInfo?: ClientInfo;
  onUpdateInfo: (clientId: string, info: ClientInfo) => void;
}

export const ClientInfoDialog = ({ clientId, clientInfo, onUpdateInfo }: ClientInfoDialogProps) => {
  const [info, setInfo] = useState<ClientInfo>(clientInfo || {
    generalInfo: "",
    meetings: [],
    socialNetworks: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSave = async (updatedInfo: ClientInfo) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('clients')
        .update({ 
          client_info: {
            generalInfo: updatedInfo.generalInfo,
            meetings: updatedInfo.meetings,
            socialNetworks: updatedInfo.socialNetworks
          }
        })
        .eq('id', clientId)
        .select()
        .single();

      if (error) {
        console.error('Error al guardar:', error);
        throw error;
      }

      console.log('Datos guardados exitosamente:', data);
      
      onUpdateInfo(clientId, updatedInfo);
      setOpen(false);
      toast({
        title: "Información actualizada",
        description: "La información del cliente ha sido actualizada correctamente.",
      });
    } catch (error) {
      console.error('Error saving client info:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Info className="h-4 w-4 mr-2" />
          Info
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Información del Cliente</DialogTitle>
          <DialogDescription>
            Gestiona la información detallada del cliente, incluyendo notas generales, reuniones y redes sociales.
          </DialogDescription>
        </DialogHeader>
        <ClientInfoForm
          initialInfo={info}
          onSave={handleSave}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};