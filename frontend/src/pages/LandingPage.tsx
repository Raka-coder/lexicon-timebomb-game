import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/stores/gameStore";
import { CreateRoomForm } from "@/components/room/CreateRoomForm";
import { JoinRoomForm } from "@/components/room/JoinRoomForm";
import { WaitingLobby } from "@/components/room/WaitingLobby";

export function LandingPage() {
  const { socket, isConnected } = useSocket();
  const { roomCode, players, gameStatus } = useGameStore();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (gameStatus === "playing") {
      navigate("/game");
    }
  }, [gameStatus, navigate]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (roomCode && gameStatus === "waiting" && players.length > 0) {
      setJoining(false);
      navigate("/lobby");
      return;
    }

    if (roomCode && gameStatus === "waiting" && players.length === 0) {
      timeoutRef.current = setTimeout(() => {
        setJoining(false);
        navigate("/lobby");
      }, 2000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [roomCode, gameStatus, players.length, navigate]);

  const handleCreateRoom = (playerName: string) => {
    if (!isConnected) return;
    setJoining(true);
    socket.emit("CREATE_ROOM", { playerName });
  };

  const handleJoinRoom = (roomCode: string, playerName: string) => {
    if (!isConnected) return;
    setJoining(true);
    socket.emit("JOIN_ROOM", { roomCode, playerName });
  };

  if (roomCode && gameStatus === "waiting") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-doom-dark">
        <WaitingLobby socket={socket} />
      </div>
    );
  }

  if (joining) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4 bg-doom-dark">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-doom-purple glow-purple">
            Masuk ke Room...
          </h1>
          <p className="text-muted-foreground">Menunggu konfirmasi</p>
        </div>
        <div className="animate-spin w-12 h-12 border-4 border-doom-cyan border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-8 bg-doom-dark">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-bold text-doom-purple glow-purple">
          Sambung Kata
        </h1>
        <p className="text-muted-foreground text-lg">
          Game kata real-time dengan teman!
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <CreateRoomForm onCreateRoom={handleCreateRoom} />
        <JoinRoomForm onJoinRoom={handleJoinRoom} />
      </div>
    </div>
  );
}