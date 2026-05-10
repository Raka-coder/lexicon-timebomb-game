import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

interface ErrorPageProps {
  code: string;
  title: string;
  message: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
  showHomeButton?: boolean;
  children?: React.ReactNode;
}

export function ErrorPage({
  code,
  title,
  message,
  detail,
  actionLabel = "Kembali ke Beranda",
  onAction,
  showHomeButton = true,
  children,
}: ErrorPageProps) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-scanlines opacity-[0.08] pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[160px] rounded-full animate-pulse" />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-destructive/5 blur-[160px] rounded-full animate-pulse"
        style={{ animationDelay: "-3s" }}
      />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Scan Line */}
      <div className="absolute inset-0 pointer-events-none animate-scanline opacity-20">
        <div className="w-full h-32 bg-linear-to-b from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 max-w-2xl w-full animate-in fade-in duration-700">
        {/* Error Code Display */}
        <div className="text-center space-y-6">
          {/* Decorative Line */}
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-primary/30" />
            <div className="h-1 w-1 rounded-full bg-primary/60 animate-pulse" />
            <div className="h-px w-16 bg-primary/30" />
          </div>

          <div className="relative">
            {/* Glitch effect layers */}
            <div
              className="absolute inset-0 text-primary/20 blur-[2px] animate-glitch-skew"
              aria-hidden="true"
            >
              <span className="text-7xl md:text-9xl font-black font-mono tracking-tighter">
                {code}
              </span>
            </div>
            <span className="relative text-7xl md:text-9xl font-black font-mono tracking-tighter text-white select-none">
              {code}
            </span>
            {/* Top glitch layer */}
            <div
              className="absolute inset-0 text-primary/10 animate-glitch"
              style={{ clipPath: "inset(0 0 60% 0)" }}
              aria-hidden="true"
            >
              <span className="text-7xl md:text-9xl font-black font-mono tracking-tighter">
                {code}
              </span>
            </div>
            {/* Bottom glitch layer */}
            <div
              className="absolute inset-0 text-accent/10 animate-glitch"
              style={{ clipPath: "inset(60% 0 0 0)", animationDelay: "-0.1s" }}
              aria-hidden="true"
            >
              <span className="text-7xl md:text-9xl font-black font-mono tracking-tighter">
                {code}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase animate-flicker">
              {title}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-mono leading-relaxed max-w-md mx-auto px-4">
              {message}
            </p>
            {detail && (
              <div className="glass rounded-xl p-4 mx-4 mt-4 border border-white/5">
                <code className="text-[11px] font-mono text-destructive/80 break-all">
                  {detail}
                </code>
              </div>
            )}
            {children && (
              <div className="flex justify-center mt-6">{children}</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <Button
            onClick={handleAction}
            className="w-full btn-stitch text-white font-black py-6 rounded-2xl text-sm uppercase tracking-[0.2em] transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] animate-pulse-glow"
          >
            <Home className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>

          {showHomeButton && actionLabel !== "Kembali ke Beranda" && (
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full text-white/30 hover:text-white/70 font-mono text-[10px] uppercase tracking-[0.3em] transition-all py-4"
            >
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              Beranda
            </Button>
          )}
        </div>

        {/* Footer */}
        <footer className="text-[8px] font-black text-muted-foreground/15 uppercase tracking-[0.6em] mt-8">
          Lexicon Timebomb — Sistem Error — {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
