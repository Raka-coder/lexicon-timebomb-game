import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import { Shield, Sparkles, LogOut, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  const { socket, isConnected } = useSocket();
  const { gameStatus, reset } = useGameStore();
  const { isAuthenticated, username, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const hasResetRef = useRef(false);

  useEffect(() => {
    if (!hasResetRef.current && (gameStatus === "finished" || gameStatus === "waiting")) {
      reset();
      hasResetRef.current = true;
    }

    if (gameStatus === "idle") {
      hasResetRef.current = false;
    }
  }, [gameStatus, reset]);

  const handleLogout = () => {
    socket?.emit("LOGOUT");
    clearAuth();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-float pointer-events-none" />
      <div
        className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[150px] rounded-full animate-float pointer-events-none"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-12 md:py-20">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left space-y-8 w-full">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border-white/10 animate-in fade-in slide-in-from-left-4 duration-700">
                <Sparkles className="h-3.5 w-3.5 text-accent fill-accent animate-pulse" />
                <span className="text-[9px] font-black text-white/80 uppercase tracking-[0.2em]">
                  Next-Gen Word Engine
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tighter text-white">
                LEXICON
                <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent glow-text-purple">
                  TIMEBOMB
                </span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Experience the{" "}
                <span className="text-serif text-white">highest-stakes</span>{" "}
                multiplayer word chain ever built. Connect, survive, and dominate
                the neural network.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="font-mono text-[9px] font-bold tracking-widest uppercase">
                  Verified DB
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                <span className="font-mono text-[9px] font-bold tracking-widest uppercase">
                  Low Latency
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-mono text-[9px] font-bold tracking-widest uppercase">
                  Global Mesh
                </span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md lg:shrink-0 space-y-4 animate-in fade-in slide-in-from-right-8 duration-1000">
            {isAuthenticated && (
              <div className="flex items-center justify-between glass rounded-2xl p-3 border-primary/20">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-white/30 hover:text-destructive transition-colors p-1"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="glass-card p-1 rounded-[2.5rem] overflow-hidden">
              <div className="bg-background/40 backdrop-blur-2xl rounded-[2.4rem] p-6 md:p-8 space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="text-xs font-black text-primary uppercase tracking-[0.4em]">
                    Initialize Protocol
                  </h3>
                  <p className="text-[10px] text-white/30 font-mono tracking-wider">
                    Mulai bermain sekarang
                  </p>
                </div>

                <Button
                  onClick={() => navigate("/play")}
                  className="w-full h-14 btn-stitch text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl"
                >
                  <Play className="h-5 w-5" />
                  <span>Mulai</span>
                </Button>

                <div className="text-center text-[10px] font-mono text-white/20 uppercase tracking-widest py-1">
                  {isAuthenticated
                    ? "Logged in — stats will be tracked"
                    : "Pilih mode di layar berikutnya"}
                </div>
              </div>
            </div>

            <div
              className={`glass rounded-2xl p-3 flex items-center justify-between border transition-all duration-500 ${
                isConnected ? "border-primary/20" : "border-destructive/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isConnected
                      ? "bg-primary shadow-[0_0_10px_var(--primary)] animate-pulse"
                      : "bg-destructive"
                  }`}
                />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
                  {isAuthenticated
                    ? "Account Mode"
                    : isConnected
                      ? "Secure Link"
                      : "Disconnected"}
                </span>
              </div>
              <span className="text-[9px] font-mono text-white/15 tracking-tighter hidden sm:block">
                {socket?.id?.slice(0, 8).toUpperCase() || "---"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 text-center py-8 text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.6em]">
        &copy; 2026 Lexicon Timebomb — Neural Interface
      </footer>
    </div>
  );
}