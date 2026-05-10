import { Trophy, XCircle, RotateCcw, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GameOverModalProps {
  isOpen: boolean;
  isWinner: boolean;
  winnerId: string | null;
  loserId: string | null;
  myPlayerId: string | null;
  players: { id: string; name: string }[];
  scores: Record<string, number>;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export function GameOverModal({
  isOpen,
  isWinner,
  winnerId,
  loserId,
  myPlayerId,
  players,
  scores,
  onPlayAgain,
  onLeave,
}: GameOverModalProps) {
  const winnerName = players.find((p) => p.id === winnerId)?.name || "Player";
  const loserName = players.find((p) => p.id === loserId)?.name || "Player";

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="glass border-white/10 p-0 overflow-hidden w-[90vw] max-w-md mx-auto"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="relative p-6 md:p-8">
          <div className="space-y-6">
            <DialogHeader className="text-center space-y-4">
              <div
                className={`p-4 w-20 h-20 mx-auto flex items-center justify-center rounded-full border-2 ${
                  isWinner
                    ? "border-accent/50 bg-accent/10"
                    : "border-destructive/30 bg-destructive/5"
                }`}
              >
                {isWinner ? (
                  <Trophy className="h-10 w-10 text-accent fill-accent animate-bounce" />
                ) : (
                  <XCircle className="h-10 w-10 text-destructive/60" />
                )}
              </div>

              <DialogTitle className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-[0.9]">
                {isWinner ? (
                  <>
                    VICTORY
                    <br />
                    <span className="text-accent">ACHIEVED</span>
                  </>
                ) : (
                  <>
                    DEFEAT
                    <br />
                    <span className="text-destructive">TERMINATED</span>
                  </>
                )}
              </DialogTitle>

              <DialogDescription
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em] glass border ${
                  isWinner
                    ? "text-accent border-accent/30"
                    : "text-destructive border-destructive/20"
                }`}
              >
                {isWinner
                  ? `${winnerName} wins!`
                  : `${loserName} wins — timeout`}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-6 py-6 border-y border-white/5">
              {players.map((player) => (
                <div key={player.id} className="text-center space-y-1">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                    {player.id === myPlayerId ? "You" : player.name}
                  </p>
                  <p className="text-4xl md:text-5xl font-black font-mono text-white">
                    {scores[player.id]?.toString().padStart(3, "0") || "000"}
                  </p>
                  <p className="text-[8px] font-bold text-primary/40 uppercase tracking-[0.2em]">
                    Points
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={onPlayAgain}
                className="w-full btn-stitch text-white font-bold py-5 rounded-xl text-sm uppercase tracking-wider transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Play Again
              </Button>
              <Button
                variant="ghost"
                onClick={onLeave}
                className="w-full text-white/40 hover:text-white font-bold uppercase text-xs tracking-[0.4em] transition-all py-2"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave Game
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}