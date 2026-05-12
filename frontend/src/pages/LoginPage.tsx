import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDefaultServerUrl,
  normalizeServerUrl,
  useSocket,
} from "@/hooks/useSocket";
import { useAuthStore } from "@/stores/authStore";
import { LoginForm } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type AuthAck = {
  ok: boolean;
  code: string;
  message?: string;
};

export function LoginPage() {
  const { socket, isConnected } = useSocket();
  const {
    isAuthenticated,
    authRequest,
    authError,
    startLogin,
    setAuthError,
    clearAuthError,
  } = useAuthStore();
  const navigate = useNavigate();
  const loginTimeoutRef = useRef<number | null>(null);
  const apiBaseUrl = normalizeServerUrl(
    import.meta.env.VITE_API_URL || import.meta.env.VITE_WS_URL || getDefaultServerUrl(),
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/play");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (authRequest !== "logging_in" && loginTimeoutRef.current) {
      window.clearTimeout(loginTimeoutRef.current);
      loginTimeoutRef.current = null;
    }
  }, [authRequest]);

  useEffect(() => {
    return () => {
      if (loginTimeoutRef.current) {
        window.clearTimeout(loginTimeoutRef.current);
      }
    };
  }, []);

  const handleLogin = (username: string, password: string) => {
    clearAuthError();
    console.log("[auth/login] submit", {
      username,
      socketConnected: isConnected,
      socketId: socket.id,
    });
    if (!isConnected) {
      console.error("[auth/login] blocked: socket disconnected");
      setAuthError("Koneksi ke server terputus. Coba lagi.");
      return;
    }
    startLogin();
    socket
      .timeout(8000)
      .emit("LOGIN", { username, password }, (err: Error | null, ack?: AuthAck) => {
        if (err) {
          console.error("[auth/login] ack timeout", { message: err.message });
          void (async () => {
            try {
              console.warn("[auth/login] trying HTTP fallback /api/auth/login");
              const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
              });
              const body = await res.json();
              if (!res.ok || !body?.ok) {
                const message =
                  body?.message ||
                  "Server belum merespons event LOGIN. Periksa backend & URL socket.";
                setAuthError(message);
                return;
              }
              console.log("[auth/login] HTTP fallback success");
              useAuthStore.getState().markLoginSuccess(
                body.userId,
                body.username,
                body.token,
              );
            } catch (fallbackErr) {
              console.error("[auth/login] HTTP fallback failed", fallbackErr);
              setAuthError(
                "Server belum merespons event LOGIN. Periksa backend & URL socket.",
              );
            }
          })();
          return;
        }
        console.log("[auth/login] ack", ack);
        if (ack && !ack.ok) {
          setAuthError(ack.message || "Login gagal.");
        }
      });
    loginTimeoutRef.current = window.setTimeout(() => {
      const { authRequest: latestRequest } = useAuthStore.getState();
      if (latestRequest === "logging_in") {
        console.error("[auth/login] no USER_LOGGED_IN/AUTH_ERROR after timeout");
        setAuthError(
          "Server belum merespons. Pastikan backend aktif, lalu coba lagi.",
        );
      }
    }, 8000);
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-float pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full animate-float pointer-events-none" style={{ animationDelay: '-3s' }} />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="max-w-md w-full relative z-10 py-8">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="h-11 px-4 glass border-white/10 text-white/60 hover:text-white hover:border-primary/30 rounded-2xl transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-xs font-black uppercase tracking-widest">Back</span>
          </Button>
        </div>

        <div className="glass-card p-1 rounded-[2.5rem] overflow-hidden">
          <div className="bg-background/40 backdrop-blur-2xl rounded-[2.4rem] p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
                Welcome Back
              </h2>
              <p className="text-primary/60 font-mono text-xs uppercase tracking-widest">
                Access your account
              </p>
            </div>
            <LoginForm
              onLogin={handleLogin}
              isLoading={authRequest === "logging_in"}
              serverError={authError}
              onSwitchToRegister={() => navigate("/register")}
            />
          </div>
        </div>

        <div className={`mt-6 glass rounded-2xl p-4 flex items-center justify-between border-white/5 ${isConnected ? 'border-primary/20' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-primary shadow-[0_0_10px_var(--primary)] animate-pulse' : 'bg-destructive'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
              Status: {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
