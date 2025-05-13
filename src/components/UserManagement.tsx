
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
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

  const {
    data: users = [],
    refetch
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const {
          data: roles,
          error: rolesError
        } = await supabase.from('user_roles').select('user_id, role');
        if (rolesError) throw rolesError;
        const {
          data: profiles,
          error: profilesError
        } = await supabase.from('profiles').select('id, full_name');
        if (profilesError) throw profilesError;

        // Combinar la información de roles y perfiles
        return roles?.map(roleData => {
          const profile = profiles?.find(p => p.id === roleData.user_id);
          return {
            id: roleData.user_id,
            role: roleData.role,
            email: profile?.full_name || roleData.user_id
          };
        }) || [];
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    },
    retry: 1
  });

  const handleCreateUser = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsLoading(true);

      // 1. Crear usuario en Supabase Auth
      const {
        data: { user },
        error: signUpError
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: email.split('@')[0]
          }
        }
      });
      
      if (signUpError) throw signUpError;
      if (!user?.id) {
        throw new Error('No se pudo crear el usuario');
      }

      // 2. Crear perfil primero - IMPORTANTE para evitar violaciones de seguridad
      const {
        error: profileError
      } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: email.split('@')[0]
      });
      
      if (profileError) throw profileError;

      // 3. Asignar rol después de crear el perfil con el ID correcto
      const {
        error: roleError
      } = await supabase.from('user_roles').insert({
        user_id: user.id,
        role
      });
      
      if (roleError) throw roleError;

      toast({
        title: "Usuario creado",
        description: `El usuario ha sido creado exitosamente con rol de ${role === 'admin' ? 'administrador' : 'diseñador'}.`
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
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 px-[2px]">
          <Users className="h-4 w-4" />
          Gestionar usuarios
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" style={{ overflow: 'hidden', maxHeight: '90vh' }}>
        <DialogHeader>
          <DialogTitle>Gestión de usuarios</DialogTitle>
          <DialogDescription>Añade nuevos usuarios y gestiona los existentes.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-1 pr-4">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Input placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} />
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
