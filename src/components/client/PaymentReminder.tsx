import { toast } from "@/hooks/use-toast";

interface PaymentReminderProps {
  clientName: string;
  paymentDay: number;
  phone: string;
}

export const PaymentReminder = ({ clientName, paymentDay, phone }: PaymentReminderProps) => {
  const handleSendReminder = () => {
    if (!phone) {
      toast({
        title: "Error",
        description: "Este cliente no tiene número de teléfono registrado",
        variant: "destructive",
      });
      return;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calcular la fecha 5 días antes del pago
    const paymentDate = new Date(currentYear, currentMonth, paymentDay);
    const reminderDate = new Date(paymentDate);
    reminderDate.setDate(paymentDate.getDate() - 5);

    const message = `Buenos días ${clientName}, este es un mensaje automático.\n\n` +
      `Les recordamos la fecha de pago del día ${reminderDate.getDate()} al ${paymentDay} de cada mes.\n\n` +
      `Los valores actualizados los vas a encontrar en el *siguiente link*:\n\n` +
      `https://gleztin.com.ar/index.php/valores-de-redes-sociales/\n` +
      `*Contraseña*: Gleztin (Con mayuscula al inicio)\n\n` +
      `En caso de tener alguna duda o no poder abonarlo dentro de la fecha establecida por favor contáctarnos.\n\n` +
      `Muchas gracias`;

    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1a1f2c]/80 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-lg shadow-sm">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recordatorio de Pago</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">Día de Pago: {paymentDay}</p>
      </div>
      <button 
        onClick={handleSendReminder} 
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
      >
        Enviar Recordatorio
      </button>
    </div>
  );
};