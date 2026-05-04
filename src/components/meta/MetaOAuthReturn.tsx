import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const MetaOAuthReturn = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get("client_id");
    const rawPages = params.get("pages") || "[]";

    try {
      const pages = JSON.parse(rawPages);
      if (clientId && window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: "meta_oauth_success", client_id: clientId, pages }, "*");
        window.close();
        return;
      }
    } catch {
      // Fallback to the main app; MetaConnectionButton will show the error if needed.
    }

    navigate(`/${window.location.search}`, { replace: true });
  }, [navigate]);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">Conectando Meta…</p>
    </main>
  );
};
