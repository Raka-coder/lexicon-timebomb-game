import { useNavigate } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useGameStore } from "@/stores/gameStore";
import { CreateRoomForm } from "@/components/room/CreateRoomForm";
import { JoinRoomForm } from "@/components/room/JoinRoomForm";
import { WaitingLobby } from "@/components/room/WaitingLobby";

export function LandingPage() {
  const { socket } = useSocket();
  const { roomCode, gameStatus } = useGameStore();
  const navigate = useNavigate();

  useGameSocket(socket);

  const handleCreateRoom = (playerName: string) => {
    socket.emit("CREATE_ROOM", { playerName });
    navigate("/lobby");
  };

  const handleJoinRoom = (roomCode: string, playerName: string) => {
    socket.emit("JOIN_ROOM", { roomCode, playerName });
    navigate("/lobby");
  };

  if (roomCode && gameStatus === "waiting") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-doom-dark">
        <WaitingLobby socket={socket} />
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