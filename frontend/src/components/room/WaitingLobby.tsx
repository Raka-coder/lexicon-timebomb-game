import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Copy, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Socket } from "socket.io-client";
import { useEffect, useMemo } from "react";

interface Props {
  socket: Socket | null;
}

export function WaitingLobby({ socket }: Props) {
  const { roomCode, players, isHost, gameStatus } = useGameStore();
  const playerList = useMemo(() => Array.isArray(players) ? players : [], [players]);

  useEffect(() => {
    console.log(">> Lobby Players Update:", playerList);
  }, [playerList]);

  const handleStartGame = () => {
    console.log(">> Requesting START_GAME via socket...");
    socket?.emit("START_GAME");
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || "");
    toast.success("Kode room disalin!", {
      className:
        "bg-doom-card border-doom-cyan text-doom-cyan font-mono text-xs uppercase tracking-widest",
    });
  };

  if (gameStatus === "playing") {
    return null;
  }

  return (
    <Card className="w-full max-w-md bg-doom-card/40 border-doom-purple/20 border backdrop-blur-md overflow-hidden rounded-4xl md:rounded-3xl">
      <CardHeader className="bg-linear-to-r from-doom-purple/20 to-transparent pb-4 md:pb-6 px-6 md:px-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-doom-purple animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest md:tracking-[0.2em] text-doom-purple/80">
              LOBBY_ACTIVE
            </span>
          </div>
          <Badge className="bg-doom-purple/10 border border-doom-purple/30 text-doom-purple text-[8px] md:text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">
            {playerList.length} Pemain
          </Badge>
        </div>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase">
            PROTOCOL
          </span>
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={copyRoomCode}
          >
            <span className="text-2xl md:text-3xl font-black font-mono text-doom-cyan glow-cyan tracking-widest transition-transform group-hover:scale-110">
              {roomCode}
            </span>
            <Copy className="h-3 w-3 md:h-4 md:w-4 text-doom-cyan/50 group-hover:text-doom-cyan transition-colors" />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 md:space-y-8 pt-6 md:pt-8 px-6 md:px-8 pb-6 md:pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            <Users className="h-3 w-3" />
            <span>Pemain Terhubung</span>
          </div>

          <div className="space-y-3">
            {playerList.map((player, index) => {
              if (!player) return null;
              const displayName = String(player.name || "Unknown");
              const playerKey = String(player.id || `player-${index}`);
              return (
                <div
                  key={playerKey}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/8"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs ${player.isHost ? "bg-doom-purple/20 text-doom-purple border border-doom-purple/30" : "bg-white/10 text-white/50 border border-white/5"}`}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-white uppercase text-sm">
                        {displayName}
                      </span>
                      {player.isHost && (
                        <span className="text-[8px] text-doom-cyan/60 uppercase tracking-wider">
                          Awal giliran
                        </span>
                      )}
                    </div>
                  </div>
                  {player.isHost && (
                    <Badge className="bg-doom-purple/20 border border-doom-purple/40 text-doom-purple text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                      HOST
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 space-y-4 border-t border-white/5">
          {isHost && playerList.length >= 2 ? (
            <div className="space-y-4">
              <Button
                onClick={handleStartGame}
                className="w-full bg-doom-purple hover:bg-doom-purple/80 text-white font-black py-6 rounded-2xl transition-all active:scale-95 group"
              >
                <Play className="mr-2 h-4 w-4 fill-current group-hover:translate-x-1 transition-transform" />
                <span className="tracking-tighter uppercase text-lg">
                  INISIASI PROTOKOL
                </span>
              </Button>
              <p className="text-[10px] text-center text-muted-foreground font-mono uppercase tracking-widest">
                Minimal 2 pemain untuk memulai
              </p>
            </div>
          ) : isHost && playerList.length < 2 ? (
            <div className="space-y-4">
              <Button
                disabled
                className="w-full bg-doom-purple/50 text-white/50 font-black py-6 rounded-2xl transition-all cursor-not-allowed"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="tracking-tighter uppercase">
                  MENUNGGU PEMAIN LAIN...
                </span>
              </Button>
              <p className="text-[10px] text-center text-muted-foreground font-mono uppercase tracking-widest">
                Minimal 2 pemain untuk memulai
              </p>
            </div>
          ) : (
            <div className="p-6 bg-doom-cyan/5 border border-doom-cyan/20 rounded-2xl flex flex-col items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-doom-cyan animate-ping" />
              <p className="text-[10px] text-center text-doom-cyan font-black uppercase tracking-[0.2em]">
                MENUNGGU HOST MEMULAI PROTOKOL...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
