import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/stores/gameStore";
import { CreateRoomForm } from "@/components/room/CreateRoomForm";
import { JoinRoomForm } from "@/components/room/JoinRoomForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, LogIn, Users } from "lucide-react";
import { toast } from "sonner";

export function PlayPage() {
  const { socket, isConnected } = useSocket();
  const { roomCode, gameStatus, players } = useGameStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") as "create" | "join" || "create";
  
  const [joining, setJoining] = useState(false);
  const [playerMode, setPlayerMode] = useState<"host" | "player">(
    mode === "join" ? "player" : "host"
  );
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (!isConnected) return;
    
    if (roomCode && gameStatus === "playing") {
      navigate("/game");
      navigatedRef.current = true;
      return;
    }
    
    if (roomCode && gameStatus === "waiting" && players.length > 0) {
      navigate("/lobby");
      navigatedRef.current = true;
      return;
    }
    
    if (!roomCode && gameStatus === "idle") {
      navigatedRef.current = false;
    }
  }, [roomCode, gameStatus, players.length, isConnected, navigate]);

  const handleCreateRoom = (playerName: string) => {
    if (!isConnected || joining) return;
    navigatedRef.current = false;
    setJoining(true);
    socket.emit("CREATE_ROOM", { playerName: playerName });
  };

  const handleJoinRoom = (roomCode: string, playerName: string) => {
    if (!isConnected || joining) return;
    navigatedRef.current = false;
    setJoining(true);
    socket.emit("JOIN_ROOM", { roomCode: roomCode, playerName: playerName });
  };

  const handleBack = () => {
    navigate("/");
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
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-3s' }} />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="max-w-md w-full relative z-10">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="h-11 px-4 glass border-white/10 text-white/60 hover:text-white hover:border-primary/30 rounded-2xl transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-xs font-black uppercase tracking-widest">Back</span>
          </Button>
        </div>

        {/* Mode Selection Tabs */}
        <div className="glass-card p-1 rounded-[2.5rem] overflow-hidden mb-6">
          <div className="flex bg-background/40 backdrop-blur-2xl rounded-[2.4rem] p-1">
            <button
              onClick={() => setPlayerMode("host")}
              className={`flex-1 h-14 rounded-[2rem] flex items-center justify-center gap-2 transition-all ${
                playerMode === "host"
                  ? "btn-stitch text-white"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-wider">Host</span>
            </button>
            <button
              onClick={() => setPlayerMode("player")}
              className={`flex-1 h-14 rounded-[2rem] flex items-center justify-center gap-2 transition-all ${
                playerMode === "player"
                  ? "btn-stitch text-white"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-wider">Player</span>
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card p-1 rounded-[2.5rem] overflow-hidden">
          <div className="bg-background/40 backdrop-blur-2xl rounded-[2.4rem] p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
                {playerMode === "host" ? "Create Room" : "Join Room"}
              </h2>
              <p className="text-primary/60 font-mono text-xs uppercase tracking-widest">
                {playerMode === "host" 
                  ? "Establish a new terminal connection" 
                  : "Inject into existing protocol"}
              </p>
            </div>

            {playerMode === "host" ? (
              <CreateRoomForm onCreateRoom={handleCreateRoom} />
            ) : (
              <JoinRoomForm onJoinRoom={handleJoinRoom} />
            )}
          </div>
        </div>

        {/* Connection Status */}
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