import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGameStore } from "@/stores/gameStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useEffect } from "react";

const formSchema = z.object({
  word: z.string().min(3, "Minimal 3 huruf"),
});

interface Props {
  onSubmit: (word: string) => void;
}

export function WordInput({ onSubmit }: Props) {
  const { isMyTurn, isValidating, requiredLetter, errorMessage, setError } =
    useGameStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      word: "",
    },
  });

  // Reset form after successful submission (when isValidating turns false)
  useEffect(() => {
    if (!isValidating) {
      form.reset();
    }
  }, [isValidating, form]);

  const onFormSubmit = (values: z.infer<typeof formSchema>) => {
    if (!isMyTurn || isValidating) return;
    
    // Check local validation before emitting
    const word = values.word.trim().toLowerCase();
    if (word[0] !== requiredLetter.toLowerCase()) {
      setError(`Harus dimulai dengan huruf "${requiredLetter.toUpperCase()}"`);
      return;
    }

    onSubmit(word);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="w-full max-w-md">
        <div className="flex gap-2">
          <FormField
            control={form.control}
            name="word"
            render={({ field }) => (
              <FormItem className="flex-1 space-y-0">
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder={isMyTurn ? `Awali dengan huruf "${requiredLetter.toUpperCase()}"` : "Menunggu giliran..."}
                      disabled={!isMyTurn || isValidating}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (errorMessage) setError(null);
                      }}
                      className={`
                        bg-background/80 border-doom h-12 text-lg font-mono
                        placeholder:text-muted-foreground/50
                        transition-all duration-200
                        ${errorMessage ? "border-red-500 animate-shake" : ""}
                        ${!isMyTurn ? "opacity-50" : ""}
                      `}
                    />
                  </FormControl>
                  {isMyTurn && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-xs text-doom-cyan font-bold">
                        {requiredLetter.toUpperCase()}→
                      </span>
                    </div>
                  )}
                </div>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={!isMyTurn || isValidating || !form.watch("word")}
            className={`
              h-12 px-6 font-bold uppercase tracking-wider
              transition-all duration-200
              ${isMyTurn
                ? "bg-doom-purple hover:bg-doom-purple/80 glow-purple"
                : "bg-muted text-muted-foreground"
              }
            `}
          >
            {isValidating ? (
              <span className="animate-spin text-xl">⟳</span>
            ) : (
              "Kirim"
            )}
          </Button>
        </div>
        {(errorMessage || form.formState.errors.word) && (
          <p className="mt-2 text-sm text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
            {errorMessage || form.formState.errors.word?.message}
          </p>
        )}
      </form>
    </Form>
  );
}
