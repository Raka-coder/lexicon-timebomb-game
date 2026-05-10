import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/stores/gameStore";
import { WaitingLobby } from "@/components/room/WaitingLobby";
import { useSocket } from "@/hooks/useSocket";
import { Button } from "@/components/ui/button";

export function LobbyPage() {
  const { roomCode, players, gameStatus, reset } = useGameStore();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  
  const playerList = Array.isArray(players) ? players : [];

  useEffect(() => {
    if (!roomCode && gameStatus === "idle") {
      navigate("/");
    } else if (gameStatus === "playing") {
      navigate("/game");
    }
  }, [roomCode, gameStatus, navigate]);

  if (!roomCode && gameStatus === "idle") {
    return null;
  }

  const handleLeaveToLanding = () => {
    socket?.emit("EXIT_GAME");
    reset();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-doom-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-scanlines opacity-10 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-doom-purple/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-doom-cyan/5 rounded-full blur-3xl" />

      <div className="max-w-4xl w-full relative z-10 flex flex-col items-center gap-8">
        {!isConnected ? (
          <div className="flex flex-col items-center gap-4 p-12 bg-doom-card/50 border border-white/5 rounded-3xl backdrop-blur-md">
            <div className="w-12 h-12 border-2 border-doom-red border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-[10px] text-doom-red uppercase tracking-widest animate-pulse">SISTEM OFFLINE: MENCOBA MENYAMBUNGKAN...</p>
          </div>
        ) : playerList.length === 0 ? (
          <div className="flex flex-col items-center gap-4 p-12 bg-doom-card/50 border border-white/5 rounded-3xl backdrop-blur-md">
            <div className="w-12 h-12 border-2 border-doom-cyan border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-[10px] text-doom-cyan uppercase tracking-widest animate-pulse">MEMUAT DATA RUANGAN: {roomCode || "..."}</p>
          </div>
        ) : (
          <div className="w-full animate-in fade-in zoom-in duration-300 space-y-6">
            <WaitingLobby socket={socket} />
            <Button
              variant="ghost"
              onClick={handleLeaveToLanding}
              className="w-full h-12 glass border-white/10 text-white/60 hover:text-white hover:border-primary/40 rounded-2xl transition-all"
            >
              Kembali ke Landing Page
            </Button>
          </div>
        )}

        <footer className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.4em]">
          Lexicon Timebomb — Lobby Protocol
        </footer>
      </div>
    </div>
  );
}
