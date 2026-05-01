import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/stores/gameStore";
import { useSocket } from "@/hooks/useSocket";
import { BombTimer } from "@/components/game/BombTimer";
import { WordInput } from "@/components/game/WordInput";
import { WordHistory } from "@/components/game/WordHistory";
import { PlayerCard } from "@/components/game/PlayerCard";
import { useGameSocket } from "@/hooks/useGameSocket";
import { sfx } from "@/lib/sfx";
import { Volume2, VolumeX, ShieldAlert, Cpu, Terminal, LayoutPanelTop, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GamePage() {
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const {
    gameStatus,
    players,
    roomCode,
    currentWord,
    requiredLetter,
    scores,
    errorMessage,
    reset
  } = useGameStore();
  const [muted, setMuted] = useState(sfx.isMuted());
  const gameOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestartingRef = useRef(false);

  useGameSocket(socket);

  const toggleMute = () => {
    const newMuted = sfx.toggleMute();
    setMuted(newMuted);
  };

  useEffect(() => {
    if (!roomCode || gameStatus === "idle") {
      navigate("/");
    }
  }, [roomCode, gameStatus, navigate]);

  useEffect(() => {
    if (gameStatus === "finished" && !isRestartingRef.current) {
      gameOverTimerRef.current = setTimeout(() => {
        reset();
        navigate("/");
      }, 60000);

      return () => {
        if (gameOverTimerRef.current) {
          clearTimeout(gameOverTimerRef.current);
        }
      };
    }
  }, [gameStatus, navigate, reset]);

  const handleSubmitWord = (word: string) => {
    socket?.emit("SUBMIT_WORD", { word });
  };

  const handleRestartGame = () => {
    isRestartingRef.current = true;
    if (gameOverTimerRef.current) {
      clearTimeout(gameOverTimerRef.current);
    }
    socket?.emit("RESTART_GAME");
  };

  if (gameStatus !== "playing" && gameStatus !== "finished") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-scanlines opacity-5 pointer-events-none" />
        <div className="flex flex-col items-center gap-10 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 border-2 border-primary/20 rounded-full animate-ping absolute inset-0" />
            <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin relative z-10 shadow-[0_0_40px_var(--primary)]" />
          </div>
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-black text-white glow-text-purple tracking-tighter uppercase">Syncing Neural Link</h1>
            <p className="text-primary/60 font-mono text-[10px] animate-pulse tracking-[0.5em] uppercase italic">Optimizing Word Transmission Streams...</p>
          </div>
        </div>
      </div>
    );
  }

  const isWinner = errorMessage?.includes("menang") || false;
  const gameOverMessage = errorMessage || (isWinner ? "LINK SECURED: VICTORY ACHIEVED" : "SYSTEM TERMINATED");

  return (
    <div className="min-h-screen bg-background p-4 md:p-10 relative overflow-hidden flex flex-col items-center">
      {/* Background Decorative Blur Assets */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[160px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/5 blur-[160px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Top Protocol Status Bar */}
      <div className="w-full max-w-6xl flex items-center justify-between mb-12 relative z-30 px-6 py-4 glass rounded-[2rem] border-white/10 shadow-2xl">
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5 opacity-40">
              <Cpu className="h-2.5 w-2.5" />
              <span className="text-[9px] font-black uppercase tracking-[0.4em]">Terminal_Identity</span>
            </div>
            <span className="text-lg font-black text-white glow-text-cyan font-mono tracking-tight">{roomCode}</span>
          </div>
          
          <div className="h-10 w-px bg-white/10 hidden lg:block" />
          
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">Stream_Status</span>
              <div className="flex items-center gap-2.5">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-primary shadow-[0_0_10px_var(--primary)] animate-pulse' : 'bg-destructive'}`} />
                <span className="text-[10px] font-black text-white/60 tracking-widest uppercase">{isConnected ? 'Uplink_Encrypted' : 'Signal_Loss'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-11 w-11 glass border-white/10 text-white/50 hover:text-white hover:border-primary/50 rounded-2xl transition-all shadow-lg"
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="hidden sm:flex items-center gap-3 h-11 px-5 glass border-destructive/20 text-destructive hover:bg-destructive/10 rounded-2xl transition-all shadow-lg"
          >
            <ShieldAlert className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Abort Link</span>
          </Button>
        </div>
      </div>

      <div className="max-w-5xl w-full space-y-12 relative z-20">
        
        {/* Central HUD: Active Word Node */}
        <div className="text-center animate-in zoom-in-95 duration-1000">
          <div className="relative inline-block">
            <div className="absolute -inset-10 bg-primary/10 blur-[100px] rounded-full opacity-60 animate-pulse" />
            <div className="relative p-1.5 glass border-white/10 rounded-[3.5rem] shadow-2xl">
              <div className="bg-background/40 backdrop-blur-3xl px-16 py-14 rounded-[3.3rem] border border-white/5 flex flex-col items-center group">
                <div className="flex items-center gap-3 mb-6 opacity-30 group-hover:opacity-60 transition-opacity">
                  <Terminal className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.6em] italic">Current_Neural_Pattern</span>
                </div>
                
                <h2 className="text-6xl md:text-8xl xl:text-9xl font-black text-white glow-text-cyan mb-8 tracking-tighter uppercase transition-all duration-700 hover:scale-105">
                  {currentWord || "..."}
                </h2>

                <div className="flex flex-col items-center gap-4">
                   <div className="flex items-center gap-5 glass border-primary/30 px-10 py-4 rounded-[2rem] shadow-2xl group/letter cursor-default">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] leading-none mb-1">Mandatory</span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Initial Character</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <span className="text-5xl font-black text-white glow-text-purple animate-pulse group-hover/letter:scale-110 transition-transform">
                      {requiredLetter?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] italic">Awaiting Next Sequence Injection...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Visualization Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-8 duration-1000 delay-200">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              playerId={player.id}
              name={player.name}
              isHost={player.isHost}
            />
          ))}
        </div>

        {/* Tactical Control HUD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-in slide-in-from-bottom-12 duration-1000 delay-500 pb-20">
          
          {/* Column: Input & Timer */}
          <div className="lg:col-span-7 space-y-12 flex flex-col items-center lg:items-start">
             <div className="w-full space-y-4">
                <div className="flex items-center gap-3 px-2 opacity-40">
                  <LayoutPanelTop className="h-3 w-3" />
                  <span className="text-[9px] font-black uppercase tracking-[0.5em]">Input_Module_Active</span>
                </div>
                <WordInput onSubmit={handleSubmitWord} />
             </div>

             <div className="flex flex-col items-center lg:items-start gap-6">
                <div className="flex items-center gap-3 px-2 opacity-40">
                  <span className="text-[9px] font-black uppercase tracking-[0.5em]">Temporal_Window</span>
                </div>
                <BombTimer />
             </div>
          </div>

          {/* Column: Transmission History */}
          <div className="lg:col-span-5 glass rounded-[2.5rem] p-8 border-white/5 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                <Terminal className="h-32 w-32" />
             </div>
             <WordHistory />
          </div>
        </div>

        {/* System Termination Protocol (Game Over) */}
        {gameStatus === "finished" && (
          <div className="fixed inset-0 bg-background/95 backdrop-blur-2xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-700">
            <div className="max-w-xl w-full relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary rounded-[3rem] blur-2xl opacity-20 animate-pulse" />
              
              <div className="relative glass border-white/10 p-12 md:p-16 rounded-[3rem] text-center space-y-12 shadow-inner">
                <div className="space-y-4">
                  <div className="p-4 glass rounded-3xl w-20 h-20 mx-auto flex items-center justify-center border-white/10 mb-6">
                     <Trophy className={`h-10 w-10 ${isWinner ? 'text-accent fill-accent animate-bounce' : 'text-destructive/40'}`} />
                  </div>
                  <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-[0.9]">
                    PROTOCOL<br /><span className="text-primary glow-text-purple">TERMINATED</span>
                  </h2>
                  <p className={`text-xs font-black uppercase tracking-[0.4em] py-3 glass rounded-full border-white/5 ${isWinner ? 'text-accent glow-text-cyan' : 'text-destructive'}`}>
                    {gameOverMessage}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-8 py-8 border-y border-white/5">
                  {players.map((player) => (
                    <div key={player.id} className="text-center space-y-2 group">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] group-hover:text-white/60 transition-colors">{player.name}</p>
                      <p className="text-5xl font-black font-mono text-white glow-text-purple">{scores[player.id]?.toString().padStart(3, '0') || '000'}</p>
                      <p className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em]">Neural_Points</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <Button
                    onClick={handleRestartGame}
                    className="w-full btn-stitch text-white font-black py-8 rounded-[2rem] text-xl uppercase tracking-widest transition-all shadow-2xl"
                  >
                    Initiate Re-Link
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="w-full text-white/30 hover:text-white font-black uppercase text-[10px] tracking-[0.6em] transition-all"
                  >
                    Disconnect Node
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-20 text-[9px] font-black text-white/10 uppercase tracking-[0.8em] relative z-10 text-center">
        Neural Mesh Link Secure — Data Integrity Verified — 2026
      </footer>
    </div>
  );
}
