import { useGameStore } from "@/stores/gameStore";

interface PlayerCardProps {
  playerId: string;
  name: string;
  isHost: boolean;
}

export function PlayerCard({ playerId, name, isHost }: PlayerCardProps) {
  const { currentPlayerId, scores, myPlayerId } = useGameStore();
  const isActive = currentPlayerId === playerId;
  const score = scores[playerId] || 0;
  const isMe = myPlayerId === playerId;

  return (
    <div
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-500
        ${isActive
          ? "border-doom-purple bg-doom-purple/5 glow-purple scale-105"
          : "border-doom bg-doom-card/50"
        }
      `}
    >
      {isActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-doom-purple text-white text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">
            ⏰ Giliran
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              font-bold text-lg
              ${isMe
                ? "bg-doom-cyan text-black"
                : "bg-muted text-muted-foreground"
              }
            `}
          >
            {name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-lg">{name}</p>
            <div className="flex items-center gap-2">
              {isHost && (
                <span className="text-xs bg-doom-purple/20 text-doom-purple px-2 py-0.5 rounded">
                  Host
                </span>
              )}
              {isMe && (
                <span className="text-xs bg-doom-cyan/20 text-doom-cyan px-2 py-0.5 rounded">
                  Kamu
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`
              text-3xl font-bold font-mono tabular-nums
              transition-all duration-300
              ${isActive ? "text-doom-purple" : "text-doom-cyan"}
            `}
          >
            {score}
          </span>
          <span className="text-xs text-muted-foreground block">skor</span>
        </div>
      </div>

      {isActive && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-doom-purple/0 via-doom-purple/5 to-doom-purple/0 animate-pulse" />
        </div>
      )}
    </div>
  );
}