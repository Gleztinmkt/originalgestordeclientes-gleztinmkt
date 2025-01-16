import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { AuthError, AuthApiError } from "@supabase/supabase-js";

export const Auth = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoading(true);
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError || !profile) {
            await supabase.auth.signOut();
          } else {
            navigate("/");
          }
        } catch (err) {
          console.error('Initial session check error:', err);
        }
      }
      setIsCheckingAuth(false);
    };

    checkInitialSession();
  }, [navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setIsLoading(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error checking profile:', profileError);
            setError('Error checking user profile');
            await supabase.auth.signOut();
            return;
          }

          if (!profile) {
            setError('You do not have access to the system. Please contact the administrator.');
            await supabase.auth.signOut();
            return;
          }

          toast({
            title: "Login successful",
            description: "Welcome to the system",
          });
          navigate("/");
        } catch (err) {
          console.error('Error during login process:', err);
          setError('Error processing login');
        } finally {
          setIsLoading(false);
        }
      } else if (event === "SIGNED_OUT") {
        setError(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleAuthError = (error: AuthError) => {
    console.error('Auth error:', error);
    let errorMessage = 'An error occurred during authentication';

    if (error instanceof AuthApiError) {
      switch (error.status) {
        case 400:
          switch (error.message) {
            case 'Invalid login credentials':
              errorMessage = 'Invalid credentials. Please check your email and password.';
              break;
            case 'Email not confirmed':
              errorMessage = 'Please confirm your email before logging in.';
              break;
            default:
              errorMessage = error.message;
          }
          break;
        case 422:
          errorMessage = 'Invalid email or password.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = error.message;
      }
    }

    setError(errorMessage);
    toast({
      variant: "destructive",
      title: "Authentication Error",
      description: errorMessage,
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

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
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;