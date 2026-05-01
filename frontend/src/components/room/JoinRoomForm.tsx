import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { LogIn, Loader2 } from "lucide-react";

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
    
    const { data, isError } = await refetch();

    if (isError || !data?.exists) {
      form.setError("roomCode", { message: "Terminal ID not found or saturated" });
      return;
    }

    onJoinRoom(code, values.playerName.trim());
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="playerName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Enter alias..."
                    {...field}
                    className="bg-white/5 border-white/5 h-12 md:h-14 text-sm font-bold tracking-widest uppercase rounded-2xl focus:bg-white/10 transition-all"
                  />
                </FormControl>
                <FormMessage className="text-destructive font-mono text-[10px] uppercase tracking-widest" />
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
                    placeholder="Terminal ID"
                    {...field}
                    maxLength={5}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    className="bg-white/5 border-white/5 h-12 md:h-14 text-sm font-black font-mono tracking-[0.2em] uppercase rounded-2xl focus:bg-white/10 transition-all text-accent"
                  />
                </FormControl>
                <FormMessage className="text-destructive font-mono text-[10px] uppercase tracking-widest" />
              </FormItem>
            )}
          />
        </div>
        <Button 
          type="submit" 
          disabled={isFetching}
          className="w-full bg-white/5 border-white/5 hover:bg-white/10 text-white h-12 md:h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all active:scale-95"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          {isFetching ? "Syncing..." : "Inject Connection"}
        </Button>
      </form>
    </Form>
  );
}
