import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/stores/gameStore";
import { useSocket } from "@/hooks/useSocket";
import { BombTimer } from "@/components/game/BombTimer";
import { WordInput } from "@/components/game/WordInput";
import { WordHistory } from "@/components/game/WordHistory";
import { PlayerCard } from "@/components/game/PlayerCard";
import { GameOverModal } from "@/components/game/GameOverModal";
import { useGameSocket } from "@/hooks/useGameSocket";
import { sfx } from "@/lib/sfx";
import { Volume2, VolumeX, ShieldAlert, Cpu, Terminal, LayoutPanelTop } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GamePage() {
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const {
    gameStatus,
    players,
    roomCode,
    myPlayerId,
    currentWord,
    requiredLetter,
    scores,
    errorMessage,
    winnerId,
    loserId,
    resetGameState
  } = useGameStore();
  const [muted, setMuted] = useState(sfx.isMuted());
  const [isRestarting, setIsRestarting] = useState(false);

  useGameSocket(socket);

  const toggleMute = () => {
    const newMuted = sfx.toggleMute();
    setMuted(newMuted);
  };

  useEffect(() => {
    if (!roomCode || gameStatus === "idle") {
      navigate("/");
    } else if (gameStatus === "waiting") {
      navigate("/lobby");
    }
  }, [roomCode, gameStatus, navigate]);

  useEffect(() => {
    if (!socket) return;
    const handleReset = () => {
      resetGameState();
      navigate("/lobby");
    };
    socket.on("ROOM_RESET", handleReset);
    return () => { socket?.off("ROOM_RESET", handleReset); };
  }, [socket, resetGameState, navigate]);

  const handleSubmitWord = (word: string) => {
    socket?.emit("SUBMIT_WORD", { word });
  };

  const handleRestartGame = () => {
    if (!socket || isRestarting) return;
    setIsRestarting(true);
    socket
      .timeout(5000)
      .emit(
        "START_GAME_AGAIN",
        (err: Error | null, ack?: { ok: boolean; message?: string }) => {
          if (err) {
            console.warn("[game/restart] START_GAME_AGAIN ack timeout, fallback to RESTART_GAME");
            socket.emit("RESTART_GAME");
            setIsRestarting(false);
            return;
          }

          if (ack && !ack.ok) {
            console.warn("[game/restart] rejected", ack.message);
            setIsRestarting(false);
            return;
          }
        },
      );
  };

  const handleExitGame = () => {
    socket?.emit("LEAVE_GAME");
    resetGameState();
  };

  useEffect(() => {
    if (!socket) return;

    const clearRestarting = () => setIsRestarting(false);
    socket.on("GAME_RESTARTED", clearRestarting);
    socket.on("ROOM_RESET", clearRestarting);
    socket.on("ROOM_ERROR", clearRestarting);
    socket.on("LEFT_GAME", clearRestarting);

    return () => {
      socket.off("GAME_RESTARTED", clearRestarting);
      socket.off("ROOM_RESET", clearRestarting);
      socket.off("ROOM_ERROR", clearRestarting);
      socket.off("LEFT_GAME", clearRestarting);
    };
  }, [socket]);

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


  const isWinner = myPlayerId && winnerId ? myPlayerId === winnerId : errorMessage?.includes("menang") || false;

  return (
    <div className="min-h-screen bg-background p-4 md:p-10 relative overflow-hidden flex flex-col items-center">
      {/* Background Decorative Blur Assets */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[160px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/5 blur-[160px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Top Protocol Status Bar */}
      <div className="w-full max-w-6xl flex items-center justify-between mb-4 md:mb-12 relative z-30 px-4 md:px-6 py-3 md:py-4 glass rounded-3xl md:rounded-4xl border-white/10 shadow-2xl">
        <div className="flex items-center gap-4 md:gap-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5 opacity-40">
              <Cpu className="h-2 w-2 md:h-2.5 md:w-2.5" />
              <span className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em]">Terminal</span>
            </div>
            <span className="text-sm md:text-lg font-black text-white glow-text-cyan font-mono tracking-tight">{roomCode}</span>
          </div>
          
          <div className="h-8 md:h-10 w-px bg-white/10 hidden sm:block" />
          
          <div className="hidden sm:flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[7px] md:text-[8px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">Status</span>
              <div className="flex items-center gap-2.5">
                <div className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full ${isConnected ? 'bg-primary shadow-[0_0_10px_var(--primary)] animate-pulse' : 'bg-destructive'}`} />
                <span className="text-[8px] md:text-[10px] font-black text-white/60 tracking-widest uppercase">{isConnected ? 'Uplink' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-9 w-9 md:h-11 md:w-11 glass border-white/10 text-white/50 hover:text-white hover:border-primary/50 rounded-xl md:rounded-2xl transition-all shadow-lg"
          >
            {muted ? <VolumeX className="h-4 w-4 md:h-5 md:w-5" /> : <Volume2 className="h-4 w-4 md:h-5 md:w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 md:gap-3 h-9 md:h-11 px-3 md:px-5 glass border-destructive/20 text-destructive hover:bg-destructive/10 rounded-xl md:rounded-2xl transition-all shadow-lg"
          >
            <ShieldAlert className="h-3 w-3 md:h-4 md:w-4" />
            <span className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">{window.innerWidth < 640 ? 'Abort' : 'Abort Link'}</span>
          </Button>
        </div>
      </div>

      <div className="max-w-5xl w-full space-y-6 md:space-y-12 relative z-20 overflow-y-auto no-scrollbar pb-10">
        
        {/* Central HUD: Active Word Node */}
        <div className="text-center animate-in zoom-in-95 duration-1000">
          <div className="relative inline-block w-full max-w-xs md:max-w-none">
            <div className="absolute -inset-4 md:-inset-10 bg-primary/10 blur-[60px] md:blur-[100px] rounded-full opacity-60 animate-pulse" />
            <div className="relative p-1 md:p-1.5 glass border-white/10 rounded-4xl md:rounded-[3.5rem] shadow-2xl">
              <div className="bg-background/40 backdrop-blur-3xl px-6 md:px-16 py-6 md:py-14 rounded-[1.8rem] md:rounded-[3.3rem] border border-white/5 flex flex-col items-center group">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6 opacity-30 group-hover:opacity-60 transition-opacity">
                  <Terminal className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                  <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-[0.4em] md:tracking-[0.6em] italic">Pattern</span>
                </div>
                
                <h2 className="text-4xl md:text-8xl xl:text-9xl font-black text-white glow-text-cyan mb-4 md:mb-8 tracking-tighter uppercase transition-all duration-700 hover:scale-105 break-all">
                  {currentWord || "..."}
                </h2>

                <div className="flex flex-col items-center gap-2 md:gap-4">
                   <div className="flex items-center gap-3 md:gap-5 glass border-primary/30 px-6 md:px-10 py-2 md:py-4 rounded-xl md:rounded-4xl shadow-2xl group/letter cursor-default">
                    <div className="flex flex-col items-end">
                      <span className="text-[6px] md:text-[8px] font-black text-white/30 uppercase tracking-[0.4em] leading-none mb-1">Mandatory</span>
                      <span className="text-[7px] md:text-[10px] font-black text-primary uppercase tracking-widest md:tracking-[0.2em]">Character</span>
                    </div>
                    <div className="h-6 md:h-8 w-px bg-white/10" />
                    <span className="text-3xl md:text-5xl font-black text-white glow-text-purple animate-pulse group-hover/letter:scale-110 transition-transform">
                      {requiredLetter?.toUpperCase() || "?"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Visualization Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-6 animate-in slide-in-from-bottom-8 duration-1000 delay-200">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-start animate-in slide-in-from-bottom-12 duration-1000 delay-500">
          
          {/* Column: Input & Timer */}
          <div className="lg:col-span-7 space-y-6 md:space-y-12 flex flex-col items-center lg:items-start">
             <div className="w-full space-y-2 md:space-y-4">
                <div className="flex items-center gap-3 px-2 opacity-40">
                  <LayoutPanelTop className="h-3 w-3" />
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em]">Input_Module</span>
                </div>
                <WordInput onSubmit={handleSubmitWord} />
             </div>

             <div className="flex flex-row md:flex-col items-center lg:items-start gap-4 md:gap-6 w-full justify-center sm:justify-start">
                <div className="hidden sm:flex items-center gap-3 px-2 opacity-40">
                  <span className="text-[9px] font-black uppercase tracking-[0.5em]">Temporal_Window</span>
                </div>
                <BombTimer />
             </div>
          </div>

          {/* Column: Transmission History */}
          <div className="lg:col-span-5 glass rounded-3xl md:rounded-3xl p-4 md:p-8 border-white/5 shadow-2xl relative overflow-hidden h-62.5 md:h-auto">
             <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                <Terminal className="h-16 md:h-32 w-16 md:w-32" />
             </div>
             <WordHistory />
          </div>
        </div>

        {/* Game Over Modal */}
        <GameOverModal
          isOpen={gameStatus === "finished"}
          isWinner={isWinner}
          winnerId={winnerId}
          loserId={loserId}
          myPlayerId={myPlayerId}
          players={players}
          scores={scores}
          onPlayAgain={handleRestartGame}
          onLeave={handleExitGame}
          playAgainDisabled={isRestarting}
          playAgainLabel={isRestarting ? "Starting..." : "Play Again"}
        />
      </div>

      <footer className="mt-10 md:mt-20 text-[7px] md:text-[9px] font-black text-white/10 uppercase tracking-[0.4em] md:tracking-[0.8em] relative z-10 text-center pb-8">
        Neural Mesh Link Secure — Data Integrity Verified — 2026
      </footer>
    </div>
  );
}
