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
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ClientInfo, SocialNetwork, SocialPlatform } from "../types/client";

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
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      console.log('Saving client info:', info); // Debug log

      const { error } = await supabase
        .from('clients')
        .update({ 
          client_info: {
            generalInfo: info.generalInfo,
            meetings: info.meetings,
            socialNetworks: info.socialNetworks
          }
        })
        .eq('id', clientId);

      if (error) {
        console.error('Supabase error:', error); // Debug log
        throw error;
      }

      onUpdateInfo(clientId, info);
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

  const addMeeting = () => {
    setInfo(prev => ({
      ...prev,
      meetings: [...prev.meetings, { date: new Date().toISOString().split('T')[0], notes: "" }],
    }));
  };

  const addSocialNetwork = () => {
    setInfo(prev => ({
      ...prev,
      socialNetworks: [...prev.socialNetworks, { platform: 'instagram' as SocialPlatform, username: '' }],
    }));
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
                <div key={index} className="space-y-2 border p-4 rounded-lg">
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
                      newNetworks[index].platform = e.target.value as SocialPlatform;
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
        <Button onClick={handleSave} className="mt-4 w-full" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};