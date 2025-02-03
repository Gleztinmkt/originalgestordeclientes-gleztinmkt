import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PublicationCardProps {
  clientName: string;
  status: string;
  planningId: string;
  onStatusChange: () => void;
}

export const PublicationCard = ({ 
  clientName, 
  status, 
  planningId,
  onStatusChange 
}: PublicationCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hacer':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'no_hacer':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'consultar':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hacer':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'no_hacer':
        return <XCircle className="h-4 w-4" />;
      case 'consultar':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleStatusChange = async () => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      const newStatus = status === 'hacer' ? 'no_hacer' : 
                       status === 'no_hacer' ? 'consultar' : 'hacer';

      const { error } = await supabase
        .from('publication_planning')
        .update({ status: newStatus })
        .eq('id', planningId);

      if (error) throw error;

      onStatusChange();
      
      toast({
        title: "Estado actualizado",
        description: "El estado de la publicación ha sido actualizado.",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={handleStatusChange}
    >
      <div className="space-y-2">
        <h3 className="text-sm font-medium truncate">{clientName}</h3>
        <Badge 
          variant="secondary" 
          className={`${getStatusColor(status)} flex items-center gap-1`}
        >
          {getStatusIcon(status)}
          {status === 'hacer' ? 'Hacer' : 
           status === 'no_hacer' ? 'No hacer' : 'Consultar'}
        </Badge>
      </div>
    </Card>
  );
};