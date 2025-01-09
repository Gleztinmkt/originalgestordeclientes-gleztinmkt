import { useState, useEffect } from "react";
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  getUserCalendars,
  saveUserCalendarPreference,
  getUserCalendarPreference 
} from "@/utils/googleCalendar";

interface GoogleCalendarIntegrationProps {
  onCalendarSelect: (calendarId: string, accessToken: string) => void;
}

export const GoogleCalendarIntegration = ({ onCalendarSelect }: GoogleCalendarIntegrationProps) => {
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("");
  const [accessToken, setAccessToken] = useState<string>("");

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      try {
        const calendars = await getUserCalendars(tokenResponse.access_token);
        setCalendars(calendars);
        
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (userId) {
          const preferredCalendarId = await getUserCalendarPreference(userId);
          if (preferredCalendarId) {
            setSelectedCalendarId(preferredCalendarId);
            onCalendarSelect(preferredCalendarId, tokenResponse.access_token);
          } else if (calendars.length > 0) {
            setSelectedCalendarId(calendars[0].id);
            onCalendarSelect(calendars[0].id, tokenResponse.access_token);
          }
        }
      } catch (error) {
        console.error("Error fetching calendars:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar tus calendarios.",
          variant: "destructive",
        });
      }
    },
    scope: "https://www.googleapis.com/auth/calendar",
  });

  const handleCalendarChange = async (calendarId: string) => {
    setSelectedCalendarId(calendarId);
    onCalendarSelect(calendarId, accessToken);
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (userId) {
      await saveUserCalendarPreference(userId, calendarId);
    }
  };

  return (
    <>
      {!accessToken ? (
        <Button onClick={() => login()} className="w-full">
          Conectar con Google Calendar
        </Button>
      ) : (
        <Select value={selectedCalendarId} onValueChange={handleCalendarChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un calendario" />
          </SelectTrigger>
          <SelectContent>
            {calendars.map((calendar) => (
              <SelectItem key={calendar.id} value={calendar.id}>
                {calendar.summary}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </>
  );
};