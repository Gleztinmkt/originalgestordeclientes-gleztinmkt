import { useState, useEffect } from 'react';
import { Bell, X, MessageCircle, CheckCircle, DollarSign, Calendar, Trash2, ArrowLeft } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isSameDay } from "date-fns";
import { es } from 'date-fns/locale';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface NotificationAction {
  label: string;
  onClick: () => void;
  type?: 'message' | 'complete' | 'payment' | 'review';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'payment' | 'task' | 'reminder' | 'publication';
  date: Date;
  priority: 'high' | 'normal' | 'low';
  action_type?: string;
  action_data?: any;
  client_id?: string;
  publication_id?: string;
  task_id?: string;
  actions?: NotificationAction[];
  clients?: {
    name: string;
  };
}

interface NotificationCenterProps {
  onSendPaymentReminders?: () => void;
  onCompleteTask?: (taskId: string) => void;
}

export const NotificationCenter = ({
  onSendPaymentReminders,
  onCompleteTask,
}: NotificationCenterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select(`
          *,
          clients (
            name
          )
        `)
        .is('deleted_at', null)
        .order('date', { ascending: false });
      
      if (notificationsError) throw notificationsError;
      
      return (notificationsData || []).map(notification => ({
        ...notification,
        date: new Date(notification.date),
        type: notification.type as 'payment' | 'task' | 'reminder' | 'publication',
        priority: notification.priority as 'high' | 'normal' | 'low',
      })) as Notification[];
    },
  });

  useEffect(() => {
    checkNotificationPermission();
    setupRealtimeSubscription();
    setupTaskReminders();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const setupTaskReminders = () => {
    const checkReminders = async () => {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .is('deleted_at', null)
        .is('completed', false)
        .not('reminder_date', 'is', null);

      if (error) {
        console.error('Error fetching task reminders:', error);
        return;
      }

      tasks.forEach(task => {
        const reminderDate = new Date(task.reminder_date);
        if (reminderDate && new Date() >= reminderDate) {
          showSystemNotification(
            'Recordatorio de tarea',
            `Tarea pendiente: ${task.content}`
          );
        }
      });
    };

    const interval = setInterval(checkReminders, 60000);
    checkReminders();

    return () => clearInterval(interval);
  };

  const checkNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const showSystemNotification = (title: string, body: string) => {
    if (notificationPermission === "granted") {
      new Notification(title, {
        body,
        icon: '/favicon.ico'
      });
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        toast({
          title: "Notificaciones activadas",
          description: "Recibirás notificaciones del sistema cuando haya actualizaciones importantes.",
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "No se pudo activar las notificaciones. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      refetch();
      toast({
        title: "Notificación descartada",
        description: "La notificación ha sido archivada.",
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast({
        title: "Error",
        description: "No se pudo descartar la notificación.",
        variant: "destructive",
      });
    }
  };

  const handleDismissAll = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ deleted_at: new Date().toISOString() })
        .is('deleted_at', null);

      if (error) throw error;

      refetch();
      toast({
        title: "Notificaciones descartadas",
        description: "Todas las notificaciones han sido archivadas.",
      });
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
      toast({
        title: "Error",
        description: "No se pudieron descartar las notificaciones.",
        variant: "destructive",
      });
    }
  };

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (priority === 'high') {
      return 'bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-100';
    }
    
    switch (type) {
      case 'payment':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-100';
      case 'task':
        return 'bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-100';
      case 'publication':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800/50 dark:text-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-100';
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      case 'task':
        return <CheckCircle className="h-4 w-4" />;
      case 'publication':
        return <Calendar className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const handleNotificationAction = async (notification: Notification) => {
    try {
      switch (notification.action_type) {
        case 'send_payment_reminder':
          if (onSendPaymentReminders && notification.client_id) {
            await onSendPaymentReminders();
            await handleDismiss(notification.id);
            toast({
              title: "Recordatorio enviado",
              description: "Se ha enviado el recordatorio de pago al cliente.",
            });
          }
          break;
        case 'complete_task':
          if (onCompleteTask && notification.task_id) {
            await onCompleteTask(notification.task_id);
            await handleDismiss(notification.id);
            toast({
              title: "Tarea completada",
              description: "Se ha marcado la tarea como completada.",
            });
          }
          break;
        case 'review_publication':
          if (notification.publication_id) {
            const { error } = await supabase
              .from('publications')
              .update({ in_review: true })
              .eq('id', notification.publication_id);

            if (error) throw error;

            await handleDismiss(notification.id);
            toast({
              title: "Publicación en revisión",
              description: "Se ha marcado la publicación para revisión.",
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la acción. Por favor, intente de nuevo.",
        variant: "destructive",
      });
    }
  };

  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = format(notification.date, 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const unreadCount = notifications.length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-2 py-1 text-xs bg-red-500 text-white"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[100vw] sm:w-[540px] p-0 bg-white dark:bg-gray-900">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="md:hidden bg-transparent dark:text-white dark:hover:bg-gray-800"
                  onClick={() => setIsOpen(false)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <SheetTitle>Notificaciones</SheetTitle>
              </div>
              <div className="flex gap-2">
                {notificationPermission !== "granted" && (
                  <Button 
                    onClick={requestNotificationPermission}
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap bg-transparent dark:text-white dark:hover:bg-gray-800"
                  >
                    Activar notificaciones
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="whitespace-nowrap dark:bg-red-900/50 dark:hover:bg-red-900"
                      disabled={notifications.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Borrar todo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Borrar todas las notificaciones?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se borrarán todas las notificaciones.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDismissAll}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </SheetHeader>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                <div key={date} className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 sticky top-0 bg-white dark:bg-gray-900 py-2">
                    {format(new Date(date), "d 'de' MMMM yyyy", { locale: es })}
                  </h3>
                  {dateNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 rounded-lg bg-white dark:bg-gray-800/50 shadow-sm border dark:border-gray-700"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getNotificationColor(notification.type, notification.priority)}>
                                <span className="flex items-center gap-1">
                                  {getNotificationIcon(notification.type)}
                                  {notification.type}
                                </span>
                              </Badge>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {format(notification.date, "HH:mm", { locale: es })}
                              </span>
                            </div>
                            <h4 className="font-semibold mb-1 dark:text-white">{notification.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {notification.message}
                              {notification.clients?.name && ` - Cliente: ${notification.clients.name}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDismiss(notification.id)}
                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-transparent ml-4"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {notification.action_type && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNotificationAction(notification)}
                              className="w-full sm:w-auto bg-transparent dark:text-white dark:hover:bg-gray-700"
                            >
                              {notification.action_type === 'send_payment_reminder' && <DollarSign className="mr-2 h-4 w-4" />}
                              {notification.action_type === 'complete_task' && <CheckCircle className="mr-2 h-4 w-4" />}
                              {notification.action_type === 'review_publication' && <Calendar className="mr-2 h-4 w-4" />}
                              {notification.action_type === 'send_payment_reminder' && 'Enviar recordatorio de pago'}
                              {notification.action_type === 'complete_task' && 'Completar tarea'}
                              {notification.action_type === 'review_publication' && 'Revisar publicación'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

