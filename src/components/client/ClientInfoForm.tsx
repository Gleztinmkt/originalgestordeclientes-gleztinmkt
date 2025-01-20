import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ClientInfo } from "../types/client";

export interface ClientInfoFormProps {
  initialInfo?: ClientInfo;
  defaultValues?: ClientInfo;
  onSave?: (info: ClientInfo) => void;
  onSubmit?: (info: ClientInfo) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

export const ClientInfoForm = ({ 
  initialInfo,
  defaultValues,
  onSave,
  onSubmit,
  isLoading = false,
  isSubmitting = false
}: ClientInfoFormProps) => {
  const [info, setInfo] = useState<ClientInfo>(
    initialInfo || defaultValues || {
      generalInfo: "",
      meetings: [],
      socialNetworks: [],
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) onSave(info);
    if (onSubmit) onSubmit(info);
  };

  const isProcessing = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="generalInfo">Información General</Label>
        <Textarea
          id="generalInfo"
          value={info.generalInfo}
          onChange={(e) => setInfo(prev => ({ ...prev, generalInfo: e.target.value }))}
          placeholder="Información general del cliente..."
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Reuniones</Label>
        {info.meetings.map((meeting, index) => (
          <div key={index} className="space-y-2 border p-4 rounded-lg">
            <Input
              type="date"
              value={meeting.date}
              onChange={(e) => {
                const newMeetings = [...info.meetings];
                newMeetings[index].date = e.target.value;
                setInfo(prev => ({ ...prev, meetings: newMeetings }));
              }}
            />
            <Textarea
              value={meeting.notes}
              onChange={(e) => {
                const newMeetings = [...info.meetings];
                newMeetings[index].notes = e.target.value;
                setInfo(prev => ({ ...prev, meetings: newMeetings }));
              }}
              placeholder="Notas de la reunión..."
            />
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                const newMeetings = info.meetings.filter((_, i) => i !== index);
                setInfo(prev => ({ ...prev, meetings: newMeetings }));
              }}
            >
              Eliminar Reunión
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setInfo(prev => ({
              ...prev,
              meetings: [...prev.meetings, { date: new Date().toISOString().split('T')[0], notes: "" }]
            }));
          }}
        >
          Agregar Reunión
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Redes Sociales</Label>
        {info.socialNetworks.map((network, index) => (
          <div key={index} className="space-y-2 border p-4 rounded-lg">
            <select
              value={network.platform}
              onChange={(e) => {
                const newNetworks = [...info.socialNetworks];
                newNetworks[index].platform = e.target.value as any;
                setInfo(prev => ({ ...prev, socialNetworks: newNetworks }));
              }}
              className="w-full p-2 border rounded-md"
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
              <option value="tiktok">TikTok</option>
              <option value="twitter">Twitter</option>
              <option value="youtube">YouTube</option>
            </select>
            <Input
              placeholder="Nombre de usuario o URL"
              value={network.username}
              onChange={(e) => {
                const newNetworks = [...info.socialNetworks];
                newNetworks[index].username = e.target.value;
                setInfo(prev => ({ ...prev, socialNetworks: newNetworks }));
              }}
            />
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                const newNetworks = info.socialNetworks.filter((_, i) => i !== index);
                setInfo(prev => ({ ...prev, socialNetworks: newNetworks }));
              }}
            >
              Eliminar Red Social
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setInfo(prev => ({
              ...prev,
              socialNetworks: [...prev.socialNetworks, { platform: "instagram", username: "" }]
            }));
          }}
        >
          Agregar Red Social
        </Button>
      </div>

      <Button type="submit" className="w-full" disabled={isProcessing}>
        {isProcessing ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
};