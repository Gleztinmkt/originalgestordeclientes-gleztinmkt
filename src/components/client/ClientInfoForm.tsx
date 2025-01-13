import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClientInfo } from "@/components/types/client";

interface ClientInfoFormProps {
  defaultValues?: ClientInfo;
  onSubmit: (data: ClientInfo) => void;
}

export const ClientInfoForm = ({ defaultValues, onSubmit }: ClientInfoFormProps) => {
  const [info, setInfo] = useState<ClientInfo>(defaultValues || {
    generalInfo: "",
    meetings: [],
    socialNetworks: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(info);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="generalInfo" className="text-sm font-medium">
          Información General
        </label>
        <Textarea
          id="generalInfo"
          value={info.generalInfo}
          onChange={(e) => setInfo(prev => ({ ...prev, generalInfo: e.target.value }))}
          placeholder="Información general del cliente..."
          className="min-h-[200px]"
        />
      </div>
      <Button type="submit" className="w-full">
        Guardar Cambios
      </Button>
    </form>
  );
};