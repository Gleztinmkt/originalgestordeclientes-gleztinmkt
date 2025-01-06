import { useState, useEffect } from 'react';
import { Bell, X, MessageCircle, CheckCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface NotificationAction {
  label: string;
  onClick: () => void;
  type?: 'message' | 'complete';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'payment' | 'task' | 'reminder';
  date: Date;
  actions?: NotificationAction[];
}

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onSendPaymentReminders?: () => void;
  onCompleteTask?: (taskId: string) => void;
}

export const NotificationCenter = ({
  notifications,
  onDismiss,
  onSendPaymentReminders,
  onCompleteTask,
}: NotificationCenterProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    setUnreadCount(notifications.length);
    checkNotificationPermission();
  }, [notifications]);

  const checkNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
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

  const sendSystemNotification = (notification: Notification) => {
    if (notificationPermission === "granted") {
      const systemNotification = new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
      });

      systemNotification.onclick = () => {
        window.focus();
        setIsOpen(true);
      };
    }
  };

  useEffect(() => {
    if (notifications.length > 0 && notificationPermission === "granted") {
      const latestNotification = notifications[notifications.length - 1];
      sendSystemNotification(latestNotification);
    }
  }, [notifications, notificationPermission]);

  const handleDismiss = (id: string) => {
    onDismiss(id);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'payment':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'task':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative dark:text-white"
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
      <SheetContent className="w-[400px] sm:w-[540px] dark:bg-gray-900 dark:text-white">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold dark:text-white">Notificaciones</SheetTitle>
          {notificationPermission !== "granted" && (
            <Button 
              onClick={requestNotificationPermission}
              variant="outline"
              className="mt-2"
            >
              Activar notificaciones del sistema
            </Button>
          )}
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border dark:border-gray-700"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getNotificationColor(notification.type)}>
                        {notification.type}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(notification.date), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1 dark:text-white">{notification.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDismiss(notification.id)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {notification.actions && (
                  <div className="flex gap-2 mt-3">
                    {notification.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={action.onClick}
                        className="dark:bg-gray-700 dark:text-white"
                      >
                        {action.type === 'message' && <MessageCircle className="mr-2 h-4 w-4" />}
                        {action.type === 'complete' && <CheckCircle className="mr-2 h-4 w-4" />}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};