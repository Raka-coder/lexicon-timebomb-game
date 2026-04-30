import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/stores/gameStore";
import { useSocket } from "@/hooks/useSocket";
import { BombTimer } from "@/components/game/BombTimer";
import { WordInput } from "@/components/game/WordInput";
import { WordHistory } from "@/components/game/WordHistory";
import { PlayerCard } from "@/components/game/PlayerCard";
import { useGameSocket } from "@/hooks/useGameSocket";

export function GamePage() {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const {
    gameStatus,
    players,
    roomCode,
    currentWord,
    requiredLetter,
  } = useGameStore();

  useGameSocket(socket);

  useEffect(() => {
    if (!roomCode || gameStatus === "idle") {
      navigate("/");
    }
  }, [roomCode, gameStatus, navigate]);

  useEffect(() => {
    if (gameStatus === "finished") {
      const timer = setTimeout(() => {
        navigate("/");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameStatus, navigate]);

  const handleSubmitWord = (word: string) => {
    socket?.emit("SUBMIT_WORD", { word });
  };

  if (gameStatus !== "playing" && gameStatus !== "finished") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-doom-dark">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⟳</div>
          <p className="text-muted-foreground">Memuat game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-doom-dark p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-doom-purple glow-purple">
            Sambung Kata
          </h1>
          <p className="text-muted-foreground">
            Room: <span className="font-mono text-doom-cyan">{roomCode}</span>
          </p>
        </div>

        <div className="text-center">
          <div className="inline-block p-4 bg-doom-card border-2 border-doom-cyan rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Kata awal:</p>
            <p className="text-4xl font-bold font-mono text-doom-cyan glow-cyan">
              {currentWord || "..."}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Sambung dengan huruf: <span className="text-doom-purple font-bold">{requiredLetter?.toUpperCase()}→</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              playerId={player.id}
              name={player.name}
              isHost={player.isHost}
            />
          ))}
        </div>

        <div className="flex justify-center">
          <BombTimer />
        </div>

        <div className="flex justify-center">
          <WordInput onSubmit={handleSubmitWord} />
        </div>

        <div className="flex justify-center">
          <WordHistory />
        </div>

        {gameStatus === "finished" && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-doom-card border-2 border-doom-purple p-8 rounded-2xl text-center max-w-md w-full glow-purple">
              <h2 className="text-2xl font-bold text-doom-purple mb-4">
                Game Over!
              </h2>
              <p className="text-muted-foreground mb-6">
                Mengalihkan ke lobby...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}