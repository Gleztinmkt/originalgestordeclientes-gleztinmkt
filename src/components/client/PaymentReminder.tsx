import { Calendar, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface PaymentReminderProps {
  clientName: string;
  paymentDay: number;
  phone: string;
}

export const PaymentReminder = ({ clientName, paymentDay, phone }: PaymentReminderProps) => {
  const sendWhatsAppReminder = () => {
    if (!phone) {
      toast({
        title: "Error",
        description: "Este cliente no tiene número de teléfono registrado",
        variant: "destructive",
      });
      return;
    }

    const message = `Buenos días, este es un mensaje automático.\n\nLes recordamos la fecha de pago del día ${paymentDay} de cada mes.\n\nMuchas gracias.\n\nEn caso de tener alguna duda o no poder abonarlo dentro de la fecha establecida por favor contáctarnos.\n\nSi los valores no fueron enviados por favor pedirlos.`;
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-blue-500" />
        <span className="font-medium">Día de pago: {paymentDay}</span>
      </div>
      <Button onClick={sendWhatsAppReminder} variant="outline" className="gap-2">
        <Send className="h-4 w-4" />
        Enviar Recordatorio
      </Button>
    </div>
  );
};