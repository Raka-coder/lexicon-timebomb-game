import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useState } from "react";

const formSchema = z.object({
  playerName: z.string().min(2, "Nama minimal 2 karakter").max(20, "Nama maksimal 20 karakter"),
  roomCode: z.string().length(5, "Kode room harus 5 karakter"),
});

interface Props {
  onJoinRoom: (roomCode: string, playerName: string) => void;
}

const API_URL = import.meta.env.VITE_WS_URL || "http://localhost:3001";

export function JoinRoomForm({ onJoinRoom }: Props) {
  const [checkingCode, setCheckingCode] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerName: "",
      roomCode: "",
    },
  });

  // TanStack Query to check room existence
  const { refetch, isFetching } = useQuery({
    queryKey: ["room", checkingCode],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/room/${checkingCode}`);
      if (!res.ok) throw new Error("Gagal mengecek room");
      return res.json();
    },
    enabled: false,
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const code = values.roomCode.toUpperCase();
    setCheckingCode(code);
    
    // Explicitly refetch to check room before joining
    const { data, isError } = await refetch();

    if (isError || !data?.exists) {
      form.setError("roomCode", { message: "Room tidak ditemukan atau sudah penuh" });
      return;
    }

    onJoinRoom(code, values.playerName.trim());
  }

  return (
    <Card className="w-full max-w-md bg-doom-card border-doom">
      <CardHeader>
        <CardTitle className="text-doom-cyan text-2xl font-bold">Gabung ke Room</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="playerName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Nama kamu"
                      {...field}
                      className="bg-background border-doom h-12 text-lg"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roomCode"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Kode Room"
                      {...field}
                      maxLength={5}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="bg-background border-doom h-12 text-lg font-mono uppercase"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              disabled={isFetching}
              className="w-full bg-doom-cyan text-black hover:bg-doom-cyan/80 h-12 text-lg font-bold transition-all"
            >
              {isFetching ? "Mengecek..." : "Gabung"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
