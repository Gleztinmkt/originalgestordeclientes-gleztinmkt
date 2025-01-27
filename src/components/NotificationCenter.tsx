import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface NotificationCenterProps {
  onSendPaymentReminders?: () => void;
  onCompleteTask?: () => void;
}

export const NotificationCenter = ({ onSendPaymentReminders, onCompleteTask }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las notificaciones.",
          variant: "destructive",
        });
      } else {
        setNotifications(data);
      }
    };

    fetchNotifications();
  }, []);

  const handleViewPublication = (publicationId: string) => {
    const publicationElement = document.querySelector(`[data-publication-id="${publicationId}"]`);
    if (publicationElement) {
      publicationElement.scrollIntoView({ behavior: 'smooth' });
      publicationElement.classList.add('highlight-publication');
      setTimeout(() => {
        publicationElement.classList.remove('highlight-publication');
      }, 2000);
    }
  };

  const handleViewTask = (taskId: string) => {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      taskElement.scrollIntoView({ behavior: 'smooth' });
      taskElement.classList.add('highlight-task');
      setTimeout(() => {
        taskElement.classList.remove('highlight-task');
      }, 2000);
    }
  };

  return (
    <div className="notification-center">
      {notifications.map((notification) => (
        <div key={notification.id} className="notification">
          <p>{notification.message}</p>
          {notification.publication_id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewPublication(notification.publication_id)}
            >
              Ver publicación
            </Button>
          )}
          {notification.task_id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewTask(notification.task_id)}
            >
              Ver tarea
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};