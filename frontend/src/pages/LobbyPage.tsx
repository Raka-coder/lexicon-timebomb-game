import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/stores/gameStore";
import { WaitingLobby } from "@/components/room/WaitingLobby";
import { useSocket } from "@/hooks/useSocket";

export function LobbyPage() {
  const { roomCode, players, gameStatus } = useGameStore();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomCode) {
      navigate("/");
    } else if (gameStatus === "playing") {
      navigate("/game");
    }
  }, [roomCode, gameStatus, navigate]);

  if (!roomCode) {
    return null;
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-doom-dark">
        <div className="text-center">
          <p className="text-doom-cyan text-xl">Menghubungkan ke server...</p>
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-doom-dark">
        <div className="text-center">
          <p className="text-doom-cyan text-xl">Memuat lobby...</p>
          <p className="text-muted-foreground mt-2">Room: {roomCode}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-doom-dark">
      <WaitingLobby socket={socket} />
    </div>
  );
}