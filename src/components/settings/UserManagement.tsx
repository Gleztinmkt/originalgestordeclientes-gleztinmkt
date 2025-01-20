import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type UserRole = "designer" | "marketing_agent" | "admin" | "calendar_viewer";

export const UserManagement = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("calendar_viewer");
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async () => {
    setLoading(true);
    try {
      // Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        // Manejar el error específico de usuario ya existente
        if (authError.message.includes("User already registered")) {
          toast({
            title: "Error",
            description: "Este correo electrónico ya está registrado. Por favor, use otro.",
            variant: "destructive",
          });
          return;
        }
        throw authError;
      }

      if (authData.user) {
        // Actualizar el perfil con el rol
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        toast({
          title: "Usuario creado",
          description: "El usuario ha sido creado exitosamente.",
        });

        // Limpiar el formulario
        setEmail("");
        setPassword("");
        setRole("calendar_viewer");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear el usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Gestionar Usuarios</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calendar_viewer">Visor de Calendario</SelectItem>
                <SelectItem value="marketing_agent">Agente de Marketing</SelectItem>
                <SelectItem value="designer">Diseñador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleCreateUser} 
            className="w-full"
            disabled={loading}
          >
            {loading ? "Creando usuario..." : "Crear Usuario"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagement;