import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";

export const UserManagement = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "designer">("designer");
  const [isLoading, setIsLoading] = useState(false);

  const { data: users = [], refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('*');

      return users.map(user => ({
        ...user,
        role: roles?.find(r => r.user_id === user.id)?.role || 'designer'
      }));
    },
  });

  const handleCreateUser = async () => {
    try {
      setIsLoading(true);
      
      // Create user in Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Assign role
      if (user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role });

        if (roleError) throw roleError;
      }

      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente.",
      });

      setIsOpen(false);
      setEmail("");
      setPassword("");
      setRole("designer");
      refetch();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Gestionar usuarios
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gestión de usuarios</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Select value={role} onValueChange={(value: "admin" | "designer") => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="designer">Diseñador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateUser} disabled={isLoading}>
            {isLoading ? "Creando..." : "Crear usuario"}
          </Button>
        </div>

        <div className="mt-6">
          <h3 className="font-medium mb-4">Usuarios existentes</h3>
          <div className="space-y-4">
            {users.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.role === 'admin' ? 'Administrador' : 'Diseñador'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};