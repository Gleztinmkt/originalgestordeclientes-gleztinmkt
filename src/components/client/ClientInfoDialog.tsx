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
import { ClientInfo, SocialNetwork, SocialPlatform, PublicationSchedule } from "../types/client";
import { Json } from "@/integrations/supabase/types";
import { useIsMobile } from "@/hooks/use-mobile";

const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'youtube', label: 'YouTube' },
] as const;

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

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
    branding: "",
    publicationSchedule: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Ensure publicationSchedule is properly formatted
      const formattedSchedule = (info.publicationSchedule || []).map(schedule => ({
        day: schedule.day,
        time: schedule.time
      }));

      // Create a clean copy of the data for saving that conforms to Json type
      const clientInfoData = {
        generalInfo: info.generalInfo || "",
        meetings: info.meetings.map(meeting => ({
          date: meeting.date || "",
          notes: meeting.notes || ""
        })),
        socialNetworks: info.socialNetworks.map(network => ({
          platform: network.platform || "instagram",
          username: network.username || ""
        })),
        branding: info.branding || "",
        publicationSchedule: formattedSchedule
      } as Json;

      console.log('Saving client info with schedule:', clientInfoData);

      const { data, error } = await supabase
        .from('clients')
        .update({ 
          client_info: clientInfoData 
        })
        .eq('id', clientId)
        .select()
        .single();

      if (error) {
        console.error('Error saving:', error);
        throw error;
      }

      console.log('Save successful:', data);
      
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

  const addSchedule = () => {
    const newSchedule = {
      day: 'monday',
      time: '09:00'
    };
    
    setInfo(prev => ({
      ...prev,
      publicationSchedule: [...(prev.publicationSchedule || []), newSchedule]
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
      <DialogContent className={`${isMobile ? 'w-[95vw] max-h-[85vh] p-4' : 'sm:max-w-[600px]'} overflow-y-auto dark:bg-gray-800 dark:text-white`}>
        <DialogHeader>
          <DialogTitle className={isMobile ? 'text-lg' : ''}>Información del Cliente</DialogTitle>
          <DialogDescription className={isMobile ? 'text-sm' : ''}>
            Gestiona la información detallada del cliente, incluyendo notas generales, reuniones y redes sociales.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 gap-1 mb-4' : 'grid-cols-4'} rounded-2xl p-1`}>
            <TabsTrigger value="general" className={isMobile ? 'text-xs py-1' : ''}>Información</TabsTrigger>
            <TabsTrigger value="meetings" className={isMobile ? 'text-xs py-1' : ''}>Reuniones</TabsTrigger>
            <TabsTrigger value="social" className={isMobile ? 'text-xs py-1' : ''}>Redes</TabsTrigger>
            <TabsTrigger value="schedule" className={isMobile ? 'text-xs py-1' : ''}>Horarios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className={isMobile ? 'mt-2' : ''}>
            <div className="space-y-4">
              <Textarea
                placeholder="Información general del cliente..."
                value={info.generalInfo}
                onChange={(e) => setInfo(prev => ({ ...prev, generalInfo: e.target.value }))}
                className={`min-h-[150px] dark:bg-gray-700 dark:text-white ${isMobile ? 'text-sm' : ''}`}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-gray-200">Branding</label>
                <Input
                  placeholder="URL del branding..."
                  value={info.branding}
                  onChange={(e) => setInfo(prev => ({ ...prev, branding: e.target.value }))}
                  className="dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="meetings" className={isMobile ? 'mt-2 space-y-3' : 'space-y-4'}>
            <Button onClick={addMeeting} variant="outline" size={isMobile ? "sm" : "default"} className={isMobile ? 'w-full text-sm' : ''}>
              Agregar Reunión
            </Button>
            {info.meetings.map((meeting, index) => (
              <div key={index} className={`space-y-2 border p-3 rounded-lg ${isMobile ? 'text-sm' : ''}`}>
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
                  className={isMobile ? 'min-h-[100px]' : ''}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="social" className={isMobile ? 'mt-2 space-y-3' : 'space-y-4'}>
            <Button onClick={addSocialNetwork} variant="outline" size={isMobile ? "sm" : "default"} className={isMobile ? 'w-full text-sm' : ''}>
              Agregar Red Social
            </Button>
            {info.socialNetworks.map((network, index) => (
              <div key={index} className={`space-y-2 border p-3 rounded-lg ${isMobile ? 'text-sm' : ''}`}>
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
          </TabsContent>

          <TabsContent value="schedule" className={isMobile ? 'mt-2 space-y-3' : 'space-y-4'}>
            <Button onClick={addSchedule} variant="outline" size={isMobile ? "sm" : "default"} className={isMobile ? 'w-full text-sm' : ''}>
              Agregar Horario
            </Button>
            {(info.publicationSchedule || []).map((schedule, index) => (
              <div key={index} className={`space-y-2 border p-3 rounded-lg ${isMobile ? 'text-sm' : ''}`}>
                <select
                  value={schedule.day}
                  onChange={(e) => {
                    const newSchedule = [...(info.publicationSchedule || [])];
                    newSchedule[index] = { ...newSchedule[index], day: e.target.value };
                    setInfo(prev => ({ ...prev, publicationSchedule: newSchedule }));
                  }}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
                <Input
                  type="time"
                  value={schedule.time}
                  onChange={(e) => {
                    const newSchedule = [...(info.publicationSchedule || [])];
                    newSchedule[index] = { ...newSchedule[index], time: e.target.value };
                    setInfo(prev => ({ ...prev, publicationSchedule: newSchedule }));
                  }}
                  className="w-full"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const newSchedule = info.publicationSchedule.filter((_, i) => i !== index);
                    setInfo(prev => ({ ...prev, publicationSchedule: newSchedule }));
                  }}
                  className={isMobile ? 'w-full text-sm' : ''}
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
        <Button onClick={handleSave} className="mt-4 w-full" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
