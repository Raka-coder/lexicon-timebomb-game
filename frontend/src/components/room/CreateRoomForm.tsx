import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

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
    <Card className="w-full max-w-md bg-doom-card border-doom">
      <CardHeader>
        <CardTitle className="text-doom-purple text-2xl font-bold">Buat Room Baru</CardTitle>
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
                      placeholder="Masukkan nama kamu"
                      {...field}
                      className="bg-background border-doom h-12 text-lg"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full bg-doom-purple hover:bg-doom-purple/80 h-12 text-lg font-bold transition-all"
            >
              Buat Room
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
