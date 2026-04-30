import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  socket: any;
}

export function WaitingLobby({ socket }: Props) {
  const { roomCode, players, isHost, gameStatus } = useGameStore();

  const handleStartGame = () => {
    socket?.emit("START_GAME");
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || "");
  };

  if (gameStatus === "playing") {
    return null;
  }

  return (
    <Card className="w-full max-w-md bg-doom-card border-doom">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Room</span>
          <Badge variant="secondary" className="text-lg font-mono bg-doom-purple text-white">
            {roomCode}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" onClick={copyRoomCode} className="w-full border-doom">
          Copy Kode Room
        </Button>

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Pemain:</h3>
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted border border-doom"
            >
              <span>{player.name}</span>
              {player.isHost && (
                <Badge className="bg-doom-purple text-white">Host</Badge>
              )}
            </div>
          ))}
        </div>

        {isHost ? (
          <Button
            onClick={handleStartGame}
            disabled={players.length < 2}
            className="w-full bg-doom-purple hover:bg-doom-purple/80"
          >
            {players.length < 2 ? "Menunggu pemain lain..." : "Mulai Game"}
          </Button>
        ) : (
          <p className="text-center text-muted-foreground">
            Menunggu host memulai game...
          </p>
        )}
      </CardContent>
    </Card>
  );
}