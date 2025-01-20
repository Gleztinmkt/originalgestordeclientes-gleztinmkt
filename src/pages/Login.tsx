import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthError } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check user role and redirect accordingly
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'admin') {
          navigate("/");
        } else {
          navigate("/calendar");
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        // Check user role and redirect accordingly
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session?.user.id)
          .single();

        toast({
          title: "Inicio de sesión exitoso",
          description: "Has iniciado sesión correctamente",
        });

        if (profile?.role === 'admin') {
          navigate("/");
        } else {
          navigate("/calendar");
        }
      }
      
      if (event === 'SIGNED_OUT') {
        navigate("/login");
      }
    });

    checkSession();
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const getErrorMessage = (error: AuthError) => {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Credenciales inválidas. Por favor verifica tu email y contraseña.';
      case 'Email not confirmed':
        return 'Por favor verifica tu email antes de iniciar sesión.';
      default:
        return error.message;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img 
            src="https://i.imgur.com/YvEDrAv.png" 
            alt="Gleztin Marketing Digital" 
            className="h-12 w-12 mx-auto mb-4"
          />
          <CardTitle>Iniciar Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1d4ed8',
                  },
                },
              },
            }}
            theme="light"
            providers={[]}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Contraseña',
                  button_label: 'Iniciar sesión',
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;