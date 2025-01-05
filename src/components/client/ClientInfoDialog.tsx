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

interface Meeting {
  date: string;
  notes: string;
}

interface ClientInfo {
  generalInfo: string;
  meetings: Meeting[];
  socialNetworks: {
    count: number;
    details: string;
  };
}

interface ClientInfoDialogProps {
  clientId: string;
  clientInfo?: ClientInfo;
  onUpdateInfo: (clientId: string, info: ClientInfo) => void;
}

export const ClientInfoDialog = ({ clientId, clientInfo, onUpdateInfo }: ClientInfoDialogProps) => {
  const [info, setInfo] = useState<ClientInfo>(clientInfo || {
    generalInfo: "",
    meetings: [],
    socialNetworks: {
      count: 0,
      details: "",
    },
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Info className="h-4 w-4 mr-2" />
          Info
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
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
                <div key={index} className="space-y-2 border p-4 rounded-lg">
                  <input
                    type="date"
                    value={meeting.date}
                    onChange={(e) => {
                      const newMeetings = [...info.meetings];
                      newMeetings[index].date = e.target.value;
                      setInfo(prev => ({ ...prev, meetings: newMeetings }));
                    }}
                    className="w-full p-2 border rounded"
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
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Cantidad de redes sociales"
                  value={info.socialNetworks.count}
                  onChange={(e) => setInfo(prev => ({
                    ...prev,
                    socialNetworks: {
                      ...prev.socialNetworks,
                      count: parseInt(e.target.value) || 0,
                    },
                  }))}
                  className="w-32"
                />
                <span>redes sociales</span>
              </div>
              <Textarea
                placeholder="Detalles de las redes sociales..."
                value={info.socialNetworks.details}
                onChange={(e) => setInfo(prev => ({
                  ...prev,
                  socialNetworks: {
                    ...prev.socialNetworks,
                    details: e.target.value,
                  },
                }))}
                className="min-h-[150px]"
              />
            </div>
          </TabsContent>
        </Tabs>
        <Button onClick={handleSave} className="mt-4">
          Guardar Cambios
        </Button>
      </DialogContent>
    </Dialog>
  );
};