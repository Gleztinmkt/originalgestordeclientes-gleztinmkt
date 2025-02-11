
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TrashDialog } from "@/components/trash/TrashDialog";
import { NotificationCenter } from "@/components/NotificationCenter";
import { UserManagement } from "@/components/UserManagement";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  userRole: string | null;
}

export const Header = ({ userRole }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente"
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        {userRole === 'admin' && (
          <>
            <TrashDialog />
            <NotificationCenter 
              onSendPaymentReminders={() => {}}
              onCompleteTask={() => {}}
            />
          </>
        )}
        <img 
          src="https://i.imgur.com/YvEDrAv.png" 
          alt="Gleztin Marketing Digital" 
          className="h-8 w-8 object-contain"
        />
      </div>
      <div className="flex items-center gap-2">
        {userRole === 'admin' && <UserManagement />}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          <LogOut className="h-5 w-5" />
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
};
