import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/stores/gameStore";
import { CreateRoomForm } from "@/components/room/CreateRoomForm";
import { JoinRoomForm } from "@/components/room/JoinRoomForm";
import { Shield, Zap, Globe, Sparkles } from "lucide-react";

export function LandingPage() {
  const { socket, isConnected } = useSocket();
  const { roomCode, gameStatus, players, reset } = useGameStore();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);
  const navigatedRef = useRef(false);
  const hasResetRef = useRef(false);

  useEffect(() => {
    if (!hasResetRef.current && gameStatus === "finished") {
      reset();
      hasResetRef.current = true;
      navigatedRef.current = false;
      setJoining(false);
    }
    
    if (!roomCode && gameStatus === "idle") {
      hasResetRef.current = false;
    }
  }, [gameStatus, roomCode, reset]);

  useEffect(() => {
    if (gameStatus === "playing") {
      navigatedRef.current = true;
      navigate("/game");
    }
  }, [gameStatus, navigate]);

  useEffect(() => {
    if (navigatedRef.current) return;
    
    if (roomCode && gameStatus === "waiting" && players.length > 0) {
      navigatedRef.current = true;
      setJoining(false);
      navigate("/lobby");
    }
  }, [roomCode, gameStatus, players.length, navigate]);

  const handleCreateRoom = (playerName: string) => {
    if (!isConnected || joining) return;
    navigatedRef.current = false;
    setJoining(true);
    socket.emit("CREATE_ROOM", { playerName });
  };

  const handleJoinRoom = (roomCode: string, playerName: string) => {
    if (!isConnected || joining) return;
    navigatedRef.current = false;
    setJoining(true);
    socket.emit("JOIN_ROOM", { roomCode, playerName });
  };

  if (joining && !roomCode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 border-2 border-primary/20 rounded-full animate-ping absolute inset-0" />
            <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin relative z-10 shadow-[0_0_30px_var(--primary)]" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white glow-text-purple tracking-tighter uppercase">Initializing Sequence</h2>
            <p className="text-primary/60 font-mono text-xs animate-pulse tracking-[0.3em] uppercase">Securing Neural Link...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border-white/10 animate-in fade-in slide-in-from-left-4 duration-700">
              <Sparkles className="h-3.5 w-3.5 text-accent fill-accent animate-pulse" />
              <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Next-Gen Word Engine Active</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tighter text-white">
              LEXICON<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent glow-text-purple">TIMEBOMB</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Experience the <span className="text-serif text-white">highest-stakes</span> multiplayer word chain ever built. Connect, survive, and dominate the neural network.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="flex items-center gap-2">
               <Shield className="h-5 w-5" />
               <span className="font-mono text-[10px] font-bold tracking-widest uppercase">Verified DB</span>
             </div>
             <div className="flex items-center gap-2">
               <Zap className="h-5 w-5" />
               <span className="font-mono text-[10px] font-bold tracking-widest uppercase">Sub-ms Latency</span>
             </div>
             <div className="flex items-center gap-2">
               <Globe className="h-5 w-5" />
               <span className="font-mono text-[10px] font-bold tracking-widest uppercase">Global Mesh</span>
             </div>
          </div>
        </div>

        {/* Right Column: Interaction Cards */}
        <div className="lg:col-span-5 space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="glass-card p-1 rounded-[2.5rem] overflow-hidden group">
            <div className="bg-background/40 backdrop-blur-2xl rounded-[2.4rem] p-2 space-y-4">
               <div className="p-6 md:p-8 space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.4em] text-center">Inhibit Access</h3>
                    <div className="space-y-4">
                      <CreateRoomForm onCreateRoom={handleCreateRoom} />
                      <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                          <span className="bg-transparent px-4 text-muted-foreground/40 backdrop-blur-sm">System Override</span>
                        </div>
                      </div>
                      <JoinRoomForm onJoinRoom={handleJoinRoom} />
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
