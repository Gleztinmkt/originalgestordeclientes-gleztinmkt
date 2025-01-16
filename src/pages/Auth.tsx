import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthError } from "@supabase/supabase-js";

export const Auth = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Verificar si el usuario tiene un perfil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          setError('Error al verificar el perfil de usuario');
          return;
        }

        if (!profile) {
          setError('No tienes acceso al sistema. Contacta al administrador.');
          await supabase.auth.signOut();
          return;
        }

        navigate("/");
      } else if (event === "SIGNED_OUT") {
        setError(null);
      }
    });

    // Listen for auth errors
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' && !session) {
        const urlParams = new URLSearchParams(window.location.search);
        const errorCode = urlParams.get('error_code');
        const errorMessage = urlParams.get('error_description');
        
        if (errorCode === 'email_not_confirmed') {
          setError('Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
        } else if (errorMessage) {
          setError(errorMessage);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      authListener.data.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleAuthError = (error: AuthError) => {
    switch (error.message) {
      case 'Invalid login credentials':
        setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
        break;
      case 'Email not confirmed':
        setError('Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
        break;
      case 'User already registered':
        setError('Este email ya está registrado. Por favor, inicia sesión.');
        break;
      default:
        if (error.message.includes('email_not_confirmed')) {
          setError('Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
        } else {
          setError(error.message);
        }
    }
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