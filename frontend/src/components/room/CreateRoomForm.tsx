import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  onCreateRoom: (playerName: string) => void;
}

export function CreateRoomForm({ onCreateRoom }: Props) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateRoom(name.trim());
    }
  };

  return (
    <Card className="w-full max-w-md bg-doom-card border-doom">
      <CardHeader>
        <CardTitle className="text-doom-purple">Buat Room Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Masukkan nama kamu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-background border-doom"
            />
          </div>
          <Button type="submit" className="w-full bg-doom-purple hover:bg-doom-purple/80">
            Buat Room
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}