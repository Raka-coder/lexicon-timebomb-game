import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSocket, setSocketAuthToken } from "@/hooks/useSocket";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import { CreateRoomForm } from "@/components/room/CreateRoomForm";
import { JoinRoomForm } from "@/components/room/JoinRoomForm";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  UserPlus,
  Users,
  Shield,
  LogOut,
  Zap,
  Award,
  Keyboard,
} from "lucide-react";
import { OnlineUsersPanel } from "@/components/room/OnlineUsersPanel";

type PlayMode = "choose" | "quick" | "account";

export function PlayPage() {
  const { socket, isConnected } = useSocket();
  const { roomCode, gameStatus, players, reset } = useGameStore();
  const { isAuthenticated, username, token, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") as "create" | "join" || "create";

  const [joining, setJoining] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>("choose");
  const [playerMode, setPlayerMode] = useState<"host" | "player">(
    mode === "join" ? "player" : "host",
  );
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (token) {
      setSocketAuthToken(token);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      setPlayMode("account");
    }
  }, [isAuthenticated]);

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

  const handleCreateRoom = (playerName: string, password?: string) => {
    if (!isConnected || joining) return;
    navigatedRef.current = false;
    setJoining(true);
    socket.emit("CREATE_ROOM", { playerName: playerName, password });
  };

  const handleJoinRoom = (roomCode: string, playerName: string, password?: string) => {
    if (!isConnected || joining) return;
    navigatedRef.current = false;
    setJoining(true);
    socket.emit("JOIN_ROOM", { roomCode: roomCode, playerName: playerName, password });
  };

  const handleLogout = () => {
    socket?.emit("LOGOUT");
    clearAuth();
    setPlayMode("choose");
  };

  const handleBack = () => {
    if (roomCode) {
      socket?.emit("LEAVE_GAME");
      reset();
    }
    setPlayMode("choose");
    navigate("/");
  };

  const handleQuickPlay = () => {
    setPlayMode("quick");
  };

  const handleAccountMode = () => {
    setPlayMode("account");
    navigate("/register");
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
            <h2 className="text-2xl font-black text-white glow-text-purple tracking-tighter uppercase">
              Initializing Sequence
            </h2>
            <p className="text-primary/60 font-mono text-xs animate-pulse tracking-[0.3em] uppercase">
              Securing Neural Link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 relative overflow-y-auto no-scrollbar">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-float pointer-events-none" />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full animate-float pointer-events-none"
        style={{ animationDelay: "-3s" }}
      />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="max-w-4xl w-full relative z-10 py-8 flex gap-8">
        <div className="flex-1 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="h-11 px-4 glass border-white/10 text-white/60 hover:text-white hover:border-primary/30 rounded-2xl transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-xs font-black uppercase tracking-widest">Back</span>
            </Button>

            {isAuthenticated && (
              <div className="flex items-center gap-2 glass rounded-xl px-3 py-1.5 border-white/10">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{username}</span>
                <button
                  onClick={handleLogout}
                  className="ml-1 text-white/30 hover:text-destructive transition-colors p-1"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* STEP 1: Choose Play Mode */}
          {playMode === "choose" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
                  Choose Your Protocol
                </h2>
                <p className="text-primary/60 font-mono text-xs uppercase tracking-widest">
                  Select how you want to play
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Quick Play */}
                <button
                  onClick={handleQuickPlay}
                  className="group glass-card p-1 rounded-3xl overflow-hidden text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="bg-background/40 backdrop-blur-2xl rounded-[1.8rem] p-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Quick Play</h3>
                      <p className="text-[10px] text-white/40 font-mono leading-relaxed">
                        Join instantly without an account. Alias will be auto-generated.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-bold text-white/30 uppercase tracking-wider">Instant</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-bold text-white/30 uppercase tracking-wider">No account</span>
                    </div>
                  </div>
                </button>

                {/* Account */}
                <button
                  onClick={handleAccountMode}
                  className="group glass-card p-1 rounded-3xl overflow-hidden text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="bg-background/40 backdrop-blur-2xl rounded-[1.8rem] p-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Award className="h-6 w-6 text-accent" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">With Account</h3>
                      <p className="text-[10px] text-white/40 font-mono leading-relaxed">
                        Login or register to track your stats and achievements across games.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-bold text-white/30 uppercase tracking-wider">Stats</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-bold text-white/30 uppercase tracking-wider">Achievements</span>
                    </div>
                  </div>
                </button>
              </div>

              <div className={`mt-6 glass rounded-2xl p-4 flex items-center justify-between border-white/5 transition-all duration-500 ${isConnected ? "border-primary/20" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-primary shadow-[0_0_10px_var(--primary)] animate-pulse" : "bg-destructive"}`} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                    Status: {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Host / Player selection + Form */}
          {(playMode === "quick" || playMode === "account") && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Mode Change Button */}
              <button
                onClick={() => setPlayMode("choose")}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Change play mode
              </button>

              <div className="glass-card p-1 rounded-[2.5rem] overflow-hidden">
                <div className="bg-background/40 backdrop-blur-2xl rounded-[2.4rem] p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
                      Initialize Protocol
                    </h2>
                    <p className="text-primary/60 font-mono text-xs uppercase tracking-widest">
                      {playerMode === "host" ? "Establish a new terminal connection" : "Inject into existing protocol"}
                    </p>
                  </div>

                  <div className="glass rounded-2xl p-1">
                    <div className="flex">
                      <button
                        onClick={() => setPlayerMode("host")}
                        className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 transition-all ${
                          playerMode === "host"
                            ? "bg-white/10 text-white"
                            : "text-white/40 hover:text-white/80"
                        }`}
                      >
                        <UserPlus className="h-4 w-4" />
                        <span className="text-xs font-black uppercase tracking-wider">Host</span>
                      </button>
                      <button
                        onClick={() => setPlayerMode("player")}
                        className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 transition-all ${
                          playerMode === "player"
                            ? "bg-white/10 text-white"
                            : "text-white/40 hover:text-white/80"
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-black uppercase tracking-wider">Player</span>
                      </button>
                    </div>
                  </div>

                  {playerMode === "host" ? (
                    <CreateRoomForm
                      onCreateRoom={handleCreateRoom}
                      defaultPlayerName={username ?? undefined}
                    />
                  ) : (
                    <JoinRoomForm
                      onJoinRoom={handleJoinRoom}
                      defaultPlayerName={username ?? undefined}
                    />
                  )}
                </div>
              </div>

              <div className={`glass rounded-2xl p-4 flex items-center justify-between border-white/5 transition-all duration-500 ${isConnected ? "border-primary/20" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-primary shadow-[0_0_10px_var(--primary)] animate-pulse" : "bg-destructive"}`} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                    Status: {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:block w-72 shrink-0">
          <OnlineUsersPanel className="sticky top-8" />
        </div>
      </div>
    </div>
  );
}
