import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { UserPlus } from "lucide-react";

const formSchema = z.object({
  playerName: z.string().min(2, "Nama minimal 2 karakter").max(20, "Nama maksimal 20 karakter"),
});

interface Props {
  onCreateRoom: (playerName: string) => void;
}

export function CreateRoomForm({ onCreateRoom }: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerName: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onCreateRoom(values.playerName.trim());
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
        <Button 
          type="submit" 
          className="w-full btn-stitch h-12 md:h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Create Terminal
        </Button>
      </form>
    </Form>
  );
}
