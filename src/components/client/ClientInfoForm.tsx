
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ClientInfo } from "@/components/types/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface ClientInfoFormProps {
  defaultValues?: ClientInfo;
  onSubmit: (data: ClientInfo) => void;
  isSubmitting?: boolean;
}

export const ClientInfoForm = ({ defaultValues, onSubmit, isSubmitting }: ClientInfoFormProps) => {
  const [info, setInfo] = useState<ClientInfo>(defaultValues || {
    generalInfo: "",
    meetings: [],
    socialNetworks: [],
    branding: "",
    publicationSchedule: []
  });
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(info);
  };

  const addMeeting = () => {
    setInfo(prev => ({
      ...prev,
      meetings: [...prev.meetings, { date: new Date().toISOString().split('T')[0], notes: "" }]
    }));
  };

  const addSocialNetwork = () => {
    setInfo(prev => ({
      ...prev,
      socialNetworks: [...prev.socialNetworks, { platform: 'instagram', username: '' }]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="generalInfo" className={`text-sm font-medium ${isMobile ? 'block mb-1' : ''}`}>
          Información General
        </label>
        <Textarea
          id="generalInfo"
          value={info.generalInfo}
          onChange={(e) => setInfo(prev => ({ ...prev, generalInfo: e.target.value }))}
          placeholder="Información general del cliente..."
          className={`min-h-[150px] ${isMobile ? 'text-sm' : ''}`}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>Reuniones</h3>
          <Button type="button" onClick={addMeeting} variant="outline" size={isMobile ? "sm" : "default"}>
            Agregar Reunión
          </Button>
        </div>
        {info.meetings.map((meeting, index) => (
          <div key={index} className={`space-y-2 border p-3 rounded-lg ${isMobile ? 'text-sm' : 'p-4'}`}>
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
              className={isMobile ? 'min-h-[100px]' : ''}
            />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>Redes Sociales</h3>
          <Button type="button" onClick={addSocialNetwork} variant="outline" size={isMobile ? "sm" : "default"}>
            Agregar Red
          </Button>
        </div>
        {info.socialNetworks.map((network, index) => (
          <div key={index} className={`space-y-2 border p-3 rounded-lg ${isMobile ? 'text-sm' : 'p-4'}`}>
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
              <option value="twitter">Twitter</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
            </select>
            <Input
              placeholder="Usuario o URL"
              value={network.username}
              onChange={(e) => {
                const newNetworks = [...info.socialNetworks];
                newNetworks[index].username = e.target.value;
                setInfo(prev => ({ ...prev, socialNetworks: newNetworks }));
              }}
              className={isMobile ? 'text-sm' : ''}
            />
          </div>
        ))}
      </div>

      <Button type="submit" className={`w-full ${isMobile ? 'text-sm py-2' : ''}`} disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
};
