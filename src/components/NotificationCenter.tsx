import { useState } from "react";
import { Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  date: string;
  read: boolean;
  client_id?: string;
  publication_id?: string;
  task_id?: string;
  priority?: string;
  action_type?: string;
  action_data?: any;
}

interface NotificationCenterProps {
  onSendPaymentReminders: () => void;
  onCompleteTask: () => void;
}

export const NotificationCenter = ({
  onSendPaymentReminders,
  onCompleteTask,
}: NotificationCenterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .is('deleted_at', null)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
  });

  const handleAction = async (notification: Notification) => {
    try {
      if (notification.action_type === 'send_payment_reminder') {
        onSendPaymentReminders();
      } else if (notification.action_type === 'complete_task') {
        onCompleteTask();
      }

      // Highlight the corresponding element
      if (notification.publication_id) {
        const element = document.querySelector(`[data-publication-id="${notification.publication_id}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('animate-highlight');
          setTimeout(() => {
            element.classList.remove('animate-highlight');
          }, 2000);
        }
      }

      if (notification.task_id) {
        const element = document.querySelector(`[data-task-id="${notification.task_id}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('animate-highlight');
          setTimeout(() => {
            element.classList.remove('animate-highlight');
          }, 2000);
        }
      }

      // Mark notification as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      setIsOpen(false);
    } catch (error) {
      console.error('Error handling notification action:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la acción. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Notificaciones</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.read
                    ? 'bg-secondary/50'
                    : 'bg-secondary'
                } ${
                  notification.priority === 'high'
                    ? 'border-red-500'
                    : 'border-border'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{notification.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notification.date), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                <p className="text-sm mb-3">{notification.message}</p>
                {notification.action_type && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAction(notification)}
                    className="w-full"
                  >
                    {notification.action_type === 'send_payment_reminder'
                      ? 'Enviar recordatorio'
                      : notification.action_type === 'complete_task'
                      ? 'Ver tarea'
                      : notification.action_type === 'review_publication'
                      ? 'Ver publicación'
                      : 'Ver detalles'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};