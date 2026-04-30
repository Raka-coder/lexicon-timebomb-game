import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  onJoinRoom: (roomCode: string, playerName: string) => void;
}

export function JoinRoomForm({ onJoinRoom }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && code.trim()) {
      onJoinRoom(code.trim().toUpperCase(), name.trim());
    }
  };

  return (
    <Card className="w-full max-w-md bg-doom-card border-doom">
      <CardHeader>
        <CardTitle className="text-doom-cyan">Gabung ke Room</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Nama kamu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-background border-doom"
            />
          </div>
          <div>
            <Input
              placeholder="Kode Room"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={5}
              required
              className="bg-background border-doom font-mono"
            />
          </div>
          <Button type="submit" className="w-full bg-doom-cyan text-black hover:bg-doom-cyan/80">
            Gabung
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}