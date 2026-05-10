import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { LogIn } from "lucide-react";
import { getDefaultServerUrl } from "@/hooks/useSocket";

const formSchema = z.object({
  playerName: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(20, "Nama maksimal 20 karakter"),
  roomCode: z.string().length(5, "Kode room harus 5 karakter"),
});

interface Props {
  onJoinRoom: (roomCode: string, playerName: string) => void;
}

const SERVER_URL = import.meta.env.VITE_WS_URL || getDefaultServerUrl();

export function JoinRoomForm({ onJoinRoom }: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerName: "",
      roomCode: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const code = values.roomCode.toUpperCase();

    try {
      // Validate room exists before joining
      const res = await fetch(`${SERVER_URL}/api/room/${code}`);

      if (!res.ok) {
        form.setError("roomCode", {
          message: "Server error or connection failed",
        });
        return;
      }

      const data = await res.json();

      if (!data?.exists) {
        form.setError("roomCode", {
          message: "Terminal ID not found or saturated",
        });
        return;
      }

      // Directly join - no second click needed
      onJoinRoom(code, values.playerName.trim());
    } catch (err) {
      console.error("Join room error:", err);
      form.setError("roomCode", {
        message: "Network error: Cannot reach server",
      });
    }
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
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
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
          className="w-full bg-white/5 border-white/5 hover:bg-white/10 text-white h-12 md:h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all active:scale-95"
        >
          <LogIn className="h-4 w-4" />
          Inject Connection
        </Button>
      </form>
    </Form>
  );
}
