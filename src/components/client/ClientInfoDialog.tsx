import { useState } from "react";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface SocialNetwork {
  platform: 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'twitter' | 'youtube';
  username: string;
}

interface Meeting {
  date: string;
  notes: string;
}

interface ClientInfo {
  generalInfo: string;
  meetings: Meeting[];
  socialNetworks: SocialNetwork[];
}

interface ClientInfoDialogProps {
  clientId: string;
  clientInfo?: ClientInfo;
  onUpdateInfo: (clientId: string, info: ClientInfo) => void;
}

const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'youtube', label: 'YouTube' },
] as const;

export const ClientInfoDialog = ({ clientId, clientInfo, onUpdateInfo }: ClientInfoDialogProps) => {
  const [info, setInfo] = useState<ClientInfo>(clientInfo || {
    generalInfo: "",
    meetings: [],
    socialNetworks: [],
  });

  const handleSave = () => {
    onUpdateInfo(clientId, info);
    toast({
      title: "Información actualizada",
      description: "La información del cliente ha sido actualizada correctamente.",
    });
  };

  const addMeeting = () => {
    setInfo(prev => ({
      ...prev,
      meetings: [...prev.meetings, { date: new Date().toISOString().split('T')[0], notes: "" }],
    }));
  };

  const deleteMeeting = (index: number) => {
    setInfo(prev => ({
      ...prev,
      meetings: prev.meetings.filter((_, i) => i !== index),
    }));
  };

  const addSocialNetwork = () => {
    setInfo(prev => ({
      ...prev,
      socialNetworks: [...prev.socialNetworks, { platform: 'instagram', username: '' }],
    }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Info className="h-4 w-4 mr-2" />
          Info
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Información del Cliente</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="meetings">Reuniones</TabsTrigger>
            <TabsTrigger value="social">Redes Sociales</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="space-y-4">
              <Textarea
                placeholder="Información general del cliente..."
                value={info.generalInfo}
                onChange={(e) => setInfo(prev => ({ ...prev, generalInfo: e.target.value }))}
                className="min-h-[200px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="meetings">
            <div className="space-y-4">
              <Button onClick={addMeeting} variant="outline" size="sm">
                Agregar Reunión
              </Button>
              {info.meetings.map((meeting, index) => (
                <div key={index} className="space-y-2 border p-4 rounded-lg relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    onClick={() => deleteMeeting(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Input
                    type="date"
                    value={meeting.date}
                    onChange={(e) => {
                      const newMeetings = [...info.meetings];
                      newMeetings[index].date = e.target.value;
                      setInfo(prev => ({ ...prev, meetings: newMeetings }));
                    }}
                    className="w-full"
                  />
                  <Textarea
                    placeholder="Notas de la reunión..."
                    value={meeting.notes}
                    onChange={(e) => {
                      const newMeetings = [...info.meetings];
                      newMeetings[index].notes = e.target.value;
                      setInfo(prev => ({ ...prev, meetings: newMeetings }));
                    }}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="social">
            <div className="space-y-4">
              <Button onClick={addSocialNetwork} variant="outline" size="sm">
                Agregar Red Social
              </Button>
              {info.socialNetworks.map((network, index) => (
                <div key={index} className="space-y-2 border p-4 rounded-lg">
                  <select
                    value={network.platform}
                    onChange={(e) => {
                      const newNetworks = [...info.socialNetworks];
                      newNetworks[index].platform = e.target.value as SocialNetwork['platform'];
                      setInfo(prev => ({ ...prev, socialNetworks: newNetworks }));
                    }}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    {SOCIAL_PLATFORMS.map(platform => (
                      <option key={platform.id} value={platform.id}>
                        {platform.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Nombre de usuario o URL"
                    value={network.username}
                    onChange={(e) => {
                      const newNetworks = [...info.socialNetworks];
                      newNetworks[index].username = e.target.value;
                      setInfo(prev => ({ ...prev, socialNetworks: newNetworks }));
                    }}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        <Button onClick={handleSave} className="mt-4 w-full">
          Guardar Cambios
        </Button>
      </DialogContent>
    </Dialog>
  );
};
