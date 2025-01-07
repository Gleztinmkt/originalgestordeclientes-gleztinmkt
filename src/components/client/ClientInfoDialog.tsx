import { useState } from "react";
import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClientInfo } from "../types/client";
import { ClientInfoForm } from "./ClientInfoForm";

interface ClientInfoDialogProps {
  clientId: string;
  clientInfo: ClientInfo;
  onUpdateInfo: (clientId: string, info: ClientInfo) => void;
}

export const ClientInfoDialog = ({ clientId, clientInfo, onUpdateInfo }: ClientInfoDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: ClientInfo) => {
    try {
      setIsSubmitting(true);
      await onUpdateInfo(clientId, values);
      setOpen(false);
    } catch (error) {
      console.error('Error updating client info:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-xl transition-colors duration-200"
        >
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Información del Cliente</DialogTitle>
        </DialogHeader>
        <ClientInfoForm
          onSubmit={handleSubmit}
          defaultValues={clientInfo}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};