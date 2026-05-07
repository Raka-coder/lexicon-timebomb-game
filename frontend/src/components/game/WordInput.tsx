import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGameStore } from "@/stores/gameStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useEffect, useRef, useState } from "react";
import { Send, Zap, AlertCircle, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  word: z.string().min(3, "Minimum 3 characters"),
});

interface Props {
  onSubmit: (word: string) => void;
}

export function WordInput({ onSubmit }: Props) {
  const { isMyTurn, isValidating, requiredLetter, errorMessage, setError, players, currentPlayer } =
    useGameStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [justStartedTurn, setJustStartedTurn] = useState(false);
  const hasNotifiedRef = useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      word: "",
    },
  });

  useEffect(() => {
    if (!isValidating) {
      form.reset();
    }
  }, [isValidating, form]);

  // Auto-focus when it's my turn
  useEffect(() => {
    if (isMyTurn && !isValidating && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isMyTurn, isValidating]);

  // Show notification when turn changes to me
  useEffect(() => {
    if (isMyTurn && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      setJustStartedTurn(true);
      toast.info("Giliranmu! Masukkan kata sekarang!", {
        duration: 2000,
        style: {
          background: 'var(--primary)',
          border: '1px solid var(--accent)',
          color: 'white',
        },
      });
      setTimeout(() => setJustStartedTurn(false), 2000);
    } else if (!isMyTurn) {
      hasNotifiedRef.current = false;
    }
  }, [isMyTurn]);

  const onFormSubmit = (values: z.infer<typeof formSchema>) => {
    if (!isMyTurn || isValidating) return;
    
    const word = values.word.trim().toLowerCase();
    if (word[0] !== requiredLetter.toLowerCase()) {
      setError(`Must start with letter "${requiredLetter.toUpperCase()}"`);
      return;
    }

    onSubmit(word);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const currentPlayerName = players.find(p => p.id === currentPlayer)?.name || "Player";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="w-full max-w-xl">
        <div className="flex flex-col gap-4">
          {/* Turn Notification */}
          <div className={`flex items-center justify-center gap-3 px-6 py-3 glass rounded-2xl transition-all duration-500 ${
            isMyTurn 
              ? "border-primary/40 bg-primary/10 animate-pulse" 
              : "border-white/5 opacity-60"
          }`}>
            {isMyTurn ? (
              <>
                <Bell className="h-4 w-4 text-primary fill-primary animate-bounce" />
                <span className="text-sm font-black text-primary uppercase tracking-wider">
                  Giliranmu! Masukkan kata sekarang
                </span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-white/20 animate-pulse" />
                <span className="text-sm font-black text-white/40 uppercase tracking-wider">
                  Menunggu {currentPlayerName}...
                </span>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <FormField
              control={form.control}
              name="word"
              render={({ field }) => (
                <FormItem className="flex-1 space-y-0">
                  <div className="relative group">
                    <div className={`absolute -inset-1 bg-gradient-to-r ${isMyTurn ? 'from-primary/40 to-accent/40' : 'from-white/5 to-white/5'} rounded-[1.5rem] blur opacity-0 group-focus-within:opacity-100 transition duration-700`} />
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          ref={(e) => {
                            field.ref(e);
                            inputRef.current = e;
                          }}
                          placeholder={isMyTurn ? `INPUT WORD STARTING WITH "${requiredLetter.toUpperCase()}"...` : "WAITING FOR TRANSMISSION..."}
                          disabled={!isMyTurn || isValidating}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          enterKeyHint="send"
                          onChange={(e) => {
                            field.onChange(e);
                            if (errorMessage) setError(null);
                          }}
                          className={`
                            glass h-16 md:h-20 text-xl font-black tracking-widest uppercase rounded-[1.4rem] px-8
                            placeholder:text-white/10 placeholder:font-bold placeholder:text-[11px] placeholder:tracking-[0.4em]
                            transition-all duration-500
                            ${errorMessage ? "border-destructive/50 shadow-[0_0_25px_rgba(var(--color-destructive),0.2)] animate-shake" : ""}
                            ${isMyTurn ? "focus:border-primary/50 focus:bg-white/[0.08]" : "opacity-40 cursor-not-allowed"}
                          `}
                        />
                      </FormControl>
                      
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none">
                        {isMyTurn && (
                          <div className="flex items-center gap-2 bg-primary/20 border border-primary/30 px-4 py-2 rounded-xl backdrop-blur-md">
                            <Zap className="h-4 w-4 text-primary fill-primary animate-pulse" />
                            <span className="text-sm font-black text-white">{requiredLetter.toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              disabled={!isMyTurn || isValidating || !form.watch("word")}
              className={`
                h-16 md:h-20 px-8 md:px-12 rounded-[1.4rem] transition-all duration-500 active:scale-95
                ${isMyTurn && form.watch("word")
                  ? "btn-stitch border-primary/20 text-white"
                  : "bg-white/5 border-white/5 text-white/20 cursor-not-allowed"
                }
              `}
            >
              {isValidating ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Send className="h-5 w-5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Send</span>
                </div>
              )}
            </Button>
          </div>

          {(errorMessage || form.formState.errors.word) && (
            <div className="flex items-center gap-3 px-6 py-3 glass border-destructive/20 rounded-2xl animate-in slide-in-from-top-2 duration-500">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-destructive leading-none">
                {errorMessage || form.formState.errors.word?.message}
              </p>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
