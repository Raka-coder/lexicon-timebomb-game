import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/stores/gameStore";
import { Shield, Zap, Globe, Sparkles, Play, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  const { socket, isConnected } = useSocket();
  const { gameStatus, reset } = useGameStore();
  const navigate = useNavigate();
  const hasResetRef = useRef(false);

  useEffect(() => {
    if (!hasResetRef.current && gameStatus === "finished") {
      reset();
      hasResetRef.current = true;
    }
    
    if (gameStatus === "idle") {
      hasResetRef.current = false;
    }
  }, [gameStatus, reset]);

  const handleStart = (mode: "create" | "join") => {
    navigate(`/play?mode=${mode}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Decorative Stitch-like Assets */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-3s' }} />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 relative z-10 items-center">
        
        {/* Left Column: Hero Content */}
        <div className="lg:col-span-7 space-y-10 text-center lg:text-left">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 glass rounded-full border-white/10 animate-in fade-in slide-in-from-left-4 duration-700">
              <Sparkles className="h-3 md:h-3.5 w-3 md:w-3.5 text-accent fill-accent animate-pulse" />
              <span className="text-[8px] md:text-[10px] font-black text-white/80 uppercase tracking-widest md:tracking-[0.2em]">Next-Gen Word Engine</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tighter text-white">
              LEXICON<br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent glow-text-purple">TIMEBOMB</span>
            </h1>
            
            <p className="text-base md:text-xl text-muted-foreground font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed px-4 sm:px-0">
              Experience the <span className="text-serif text-white">highest-stakes</span> multiplayer word chain ever built. Connect, survive, and dominate the neural network.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="flex items-center gap-2">
               <Shield className="h-4 w-4 md:h-5 md:w-5" />
               <span className="font-mono text-[8px] md:text-[10px] font-bold tracking-widest uppercase">Verified DB</span>
             </div>
             <div className="flex items-center gap-2">
               <Zap className="h-4 w-4 md:h-5 md:w-5" />
               <span className="font-mono text-[8px] md:text-[10px] font-bold tracking-widest uppercase">Latency</span>
             </div>
             <div className="flex items-center gap-2">
               <Globe className="h-4 w-4 md:h-5 md:w-5" />
               <span className="font-mono text-[8px] md:text-[10px] font-bold tracking-widest uppercase">Global Mesh</span>
             </div>
          </div>
        </div>

        {/* Right Column: Interaction Cards */}
        <div className="lg:col-span-5 space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="glass-card p-1 rounded-[2.5rem] overflow-hidden group">
            <div className="bg-background/40 backdrop-blur-2xl rounded-[2.4rem] p-2 space-y-4">
               <div className="p-6 md:p-8 space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.4em] text-center">Initialize Protocol</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          onClick={() => handleStart("create")}
                          className="w-full h-14 md:h-16 btn-stitch text-white font-black text-xs md:text-sm uppercase tracking-wider flex flex-col items-center gap-0.5 md:gap-1 rounded-xl md:rounded-2xl"
                        >
                          <Play className="h-4 w-4 md:h-5 md:w-5" />
                          <span>Create</span>
                        </Button>
                        <Button
                          onClick={() => handleStart("join")}
                          className="w-full h-14 md:h-16 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-xs md:text-sm uppercase tracking-wider flex flex-col items-center gap-0.5 md:gap-1 rounded-xl md:rounded-2xl transition-all active:scale-95"
                        >
                          <LogIn className="h-4 w-4 md:h-5 md:w-5" />
                          <span>Join</span>
                        </Button>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <div className={`glass rounded-2xl p-4 flex items-center justify-between border-white/5 transition-all duration-500 ${isConnected ? 'border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]' : ''}`}>
             <div className="flex items-center gap-3">
               <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-primary shadow-[0_0_10px_var(--primary)] animate-pulse' : 'bg-destructive'}`} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                 System Network: {isConnected ? 'SECURE_LINK' : 'LINK_FAILURE'}
               </span>
             </div>
             <span className="text-[10px] font-mono text-white/20 tracking-tighter">NODE_ID: {socket?.id?.slice(0, 8).toUpperCase() || '---'}</span>
          </div>
        </div>
      </div>

      <footer className="mt-20 lg:mt-24 text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.6em] transition-opacity hover:opacity-50 cursor-default relative z-10">
        &copy; 2026 Lexicon Timebomb — Synthetic Intelligence Interface
      </footer>
    </div>
  );
}
