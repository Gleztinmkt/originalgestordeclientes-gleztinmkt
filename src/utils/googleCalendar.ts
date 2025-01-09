import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const createGoogleCalendarEvent = async (
  accessToken: string,
  calendarId: string,
  eventData: {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
  }
) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: eventData.title,
          description: eventData.description,
          start: {
            dateTime: eventData.startDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: eventData.endDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create Google Calendar event");
    }

    const event = await response.json();
    return event.id;
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    throw error;
  }
};

export const deleteGoogleCalendarEvent = async (
  accessToken: string,
  calendarId: string,
  eventId: string
) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete Google Calendar event");
    }
  } catch (error) {
    console.error("Error deleting Google Calendar event:", error);
    throw error;
  }
};

export const getUserCalendars = async (accessToken: string) => {
  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch calendars");
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error("Error fetching calendars:", error);
    throw error;
  }
};

export const saveUserCalendarPreference = async (userId: string, calendarId: string) => {
  try {
    const { error } = await supabase
      .from("user_calendar_preferences")
      .upsert(
        { user_id: userId, selected_calendar_id: calendarId },
        { onConflict: "user_id" }
      );

    if (error) throw error;

    toast({
      title: "Calendario guardado",
      description: "Tu calendario predeterminado ha sido actualizado.",
    });
  } catch (error) {
    console.error("Error saving calendar preference:", error);
    toast({
      title: "Error",
      description: "No se pudo guardar tu preferencia de calendario.",
      variant: "destructive",
    });
  }
};

export const getUserCalendarPreference = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("user_calendar_preferences")
      .select("selected_calendar_id")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data?.selected_calendar_id;
  } catch (error) {
    console.error("Error fetching calendar preference:", error);
    return null;
  }
};