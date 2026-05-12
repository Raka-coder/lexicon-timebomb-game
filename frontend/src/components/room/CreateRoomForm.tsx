import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { UserPlus, Lock, Unlock } from "lucide-react";

const formSchema = z.object({
  playerName: z.string().min(2, "Nama minimal 2 karakter").max(20, "Nama maksimal 20 karakter"),
  password: z.string().min(4, "Password minimal 4 karakter").max(20, "Password maksimal 20 karakter").optional().or(z.literal("")),
});

interface Props {
  onCreateRoom: (playerName: string, password?: string) => void;
  defaultPlayerName?: string;
}

export function CreateRoomForm({ onCreateRoom, defaultPlayerName }: Props) {
  const [usePassword, setUsePassword] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerName: defaultPlayerName || "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const password = usePassword && values.password ? values.password : undefined;
    onCreateRoom(values.playerName.trim(), password);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        {usePassword && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Room Password (opsional)"
                    {...field}
                    className="bg-white/5 border-white/5 h-12 md:h-14 text-sm font-bold tracking-widest rounded-2xl focus:bg-white/10 transition-all"
                  />
                </FormControl>
                <FormMessage className="text-destructive font-mono text-[10px] uppercase tracking-widest" />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setUsePassword(!usePassword)}
            className="shrink-0 h-12 md:h-14 px-4 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:border-primary/40 transition-all"
          >
            {usePassword ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </Button>
          <Button
            type="submit"
            className="flex-1 btn-stitch h-12 md:h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {usePassword ? "Create Secure Terminal" : "Create Terminal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}