import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { AuthError } from "@supabase/supabase-js";

export const Auth = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error al verificar perfil:', profileError);
            setError('Error al verificar el perfil de usuario');
            return;
          }

          if (!profile) {
            setError('No tienes acceso al sistema. Contacta al administrador.');
            await supabase.auth.signOut();
            return;
          }

          toast({
            title: "Inicio de sesión exitoso",
            description: "Bienvenido al sistema",
          });
          navigate("/");
        } catch (err) {
          console.error('Error en el proceso de inicio de sesión:', err);
          setError('Error al procesar el inicio de sesión');
        }
      } else if (event === "SIGNED_OUT") {
        setError(null);
      }
    });

    // Check URL parameters for errors on load
    const urlParams = new URLSearchParams(window.location.search);
    const errorDescription = urlParams.get('error_description');
    if (errorDescription) {
      handleAuthError(new AuthError(errorDescription, 400));
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleAuthError = (error: AuthError) => {
    console.error('Auth error:', error);
    let errorMessage = 'Ha ocurrido un error durante la autenticación';

    try {
      // Parse error body if it's a JSON string
      const errorBody = error.message.includes('{') 
        ? JSON.parse(error.message)
        : { code: error.message };

      switch (errorBody.code) {
        case 'user_already_exists':
          errorMessage = 'Este email ya está registrado. Por favor, inicia sesión.';
          break;
        case 'email_not_confirmed':
          errorMessage = 'Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.';
          break;
        case 'invalid_credentials':
          errorMessage = 'Credenciales inválidas. Por favor, verifica tu email y contraseña.';
          break;
        default:
          if (error.message.includes('email_not_confirmed')) {
            errorMessage = 'Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.';
          } else {
            errorMessage = error.message;
          }
      }
    } catch (e) {
      console.error('Error parsing auth error:', e);
    }

    setError(errorMessage);
    toast({
      variant: "destructive",
      title: "Error de autenticación",
      description: errorMessage,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Gestor de clientes Gleztin Marketing Digital
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <SupabaseAuth 
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#000000',
                    brandAccent: '#333333',
                  },
                },
              },
            }}
            providers={[]}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;