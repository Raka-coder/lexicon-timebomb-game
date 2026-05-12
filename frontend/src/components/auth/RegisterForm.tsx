import { useState } from "react";
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
import { UserPlus, Eye, EyeOff } from "lucide-react";

const formSchema = z.object({
  username: z
    .string()
    .min(2, "Username minimal 2 karakter")
    .max(20, "Username maksimal 20 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Hanya huruf, angka, dan underscore"),
  password: z
    .string()
    .min(4, "Password minimal 4 karakter")
    .max(32, "Password maksimal 32 karakter"),
});

interface Props {
  onRegister: (username: string, password: string) => void;
  isLoading?: boolean;
  serverError?: string | null;
  onSwitchToLogin: () => void;
}

export function RegisterForm({
  onRegister,
  isLoading,
  serverError,
  onSwitchToLogin,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onRegister(values.username.trim(), values.password);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Username..."
                  {...field}
                  autoComplete="username"
                  className="bg-white/5 border-white/5 h-12 md:h-14 text-sm font-bold tracking-widest uppercase rounded-2xl focus:bg-white/10 transition-all"
                />
              </FormControl>
              <FormMessage className="text-destructive font-mono text-[10px] uppercase tracking-widest" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password..."
                    {...field}
                    autoComplete="new-password"
                    className="bg-white/5 border-white/5 h-12 md:h-14 text-sm font-bold tracking-widest rounded-2xl focus:bg-white/10 transition-all pr-12"
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <FormMessage className="text-destructive font-mono text-[10px] uppercase tracking-widest" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full btn-stitch h-12 md:h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          {isLoading ? "Mendaftar..." : "Daftar"}
        </Button>

        {serverError ? (
          <p className="text-center text-[10px] font-mono text-destructive uppercase tracking-widest">
            {serverError}
          </p>
        ) : null}

        <p className="text-center text-[10px] font-mono text-white/40 uppercase tracking-widest">
          Sudah punya akun?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
          >
            Login
          </button>
        </p>
      </form>
    </Form>
  );
}
