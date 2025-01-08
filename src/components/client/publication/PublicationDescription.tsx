import { Publication } from "./types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

interface PublicationDescriptionProps {
  publication: Publication | null;
  onClose: () => void;
}

export const PublicationDescription = ({ publication, onClose }: PublicationDescriptionProps) => {
  if (!publication) return null;

  return (
    <Dialog open={!!publication} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{publication.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Fecha</p>
            <p>{format(new Date(publication.date), "dd/MM/yyyy")}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tipo</p>
            <p>{publication.type}</p>
          </div>
          {publication.description && (
            <div>
              <p className="text-sm text-gray-500">Descripción</p>
              <p className="whitespace-pre-wrap">{publication.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};