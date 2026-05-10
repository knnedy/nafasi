"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowRight,
  Shield,
  Mail,
  Eye,
  EyeOff,
  Ticket,
  CalendarDays,
  MapPin,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { api, APIError } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const signInSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type SignInForm = z.infer<typeof signInSchema>;

const mockEvents = [
  {
    name: "Afropunk Nairobi",
    category: "Music",
    date: "SAT 14 JUN",
    location: "Uhuru Gardens",
    color: "#F97316",
  },
  {
    name: "Tech Summit East Africa",
    category: "Conference",
    date: "WED 25 JUN",
    location: "KICC, Nairobi",
    color: "#8B5CF6",
  },
  {
    name: "Nairobi Jazz Festival",
    category: "Music",
    date: "FRI 4 JUL",
    location: "Village Market",
    color: "#0EA5E9",
  },
];

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (data: SignInForm) => {
    try {
      const res = await api.public.post("/api/v1/auth/login", {
        email: data.email,
        password: data.password,
      });

      const json = await res.json();

      setAuth(json.data.user, json.data.access_token);
      toast.success("Welcome back!");
      router.push("/");
    } catch (err) {
      if (err instanceof APIError) {
        if (err.code === "INVALID_CREDENTIALS") {
          form.setError("email", { message: " " });
          form.setError("password", {
            message: "Invalid email or password",
          });
          return;
        }
        if (err.code === "ORGANISER_NOT_VERIFIED") {
          toast.error("Your organiser account is pending admin approval.");
          return;
        }
        if (err.code === "USER_BANNED") {
          toast.error(
            "Your account has been banned. Contact support for help.",
          );
          return;
        }
        toast.error(err.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0C0A09] font-sans">
      {/* left panel */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <div
          className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(251,146,60,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center">
            <Ticket className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-white font-black tracking-[0.2em] text-sm uppercase">
              NAFASI
            </span>
            <span className="block text-white/30 text-[10px] tracking-[0.15em] uppercase">
              Discover. Book. Experience.
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <p className="text-orange-400/80 text-xs font-semibold tracking-[0.25em] uppercase">
              Welcome back
            </p>
            <h2 className="text-white font-black text-5xl leading-[1.05] tracking-tight text-balance">
              Your next{"\n"}event is{"\n"}waiting.
            </h2>
            <p className="text-white/40 text-base leading-relaxed max-w-sm">
              Sign back in and pick up where you left off.
            </p>
          </div>

          <div className="space-y-3 max-w-sm">
            {mockEvents.map((event, i) => (
              <div
                key={i}
                className="group flex items-center gap-0 rounded-xl overflow-hidden border border-white/6 bg-white/3 hover:bg-white/6 transition-all duration-300 cursor-default">
                <div
                  className="w-1 self-stretch shrink-0 rounded-l-xl"
                  style={{ background: event.color }}
                />
                <div className="flex flex-col gap-1.25 px-2 py-4">
                  {[...Array(4)].map((_, j) => (
                    <div
                      key={j}
                      className="w-0.75 h-0.75 rounded-full bg-white/10"
                    />
                  ))}
                </div>
                <div className="flex-1 py-3 pr-4 min-w-0">
                  <p className="text-white/90 text-sm font-semibold truncate leading-tight">
                    {event.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color: event.color,
                        background: `${event.color}20`,
                      }}>
                      {event.category}
                    </span>
                    <span className="text-white/30 text-[10px] flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {event.date}
                    </span>
                  </div>
                </div>
                <div className="pr-4 hidden sm:flex items-center gap-1 text-white/25 text-[10px]">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-20">{event.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/20 text-xs tracking-wide">
          © 2026 NAFASI Ltd. All rights reserved.
        </div>
      </div>

      {/* divider */}
      <div className="hidden lg:flex flex-col items-center justify-between py-16 relative w-px">
        <div className="absolute inset-0 w-px bg-white/[0.07] mx-auto" />
        <div className="w-5 h-5 rounded-full bg-[#0C0A09] border border-white/[0.07] z-10 -ml-2.5" />
        <div className="flex flex-col gap-1.5 z-10">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-0.75 h-0.75 rounded-full bg-white/10 -ml-px"
            />
          ))}
        </div>
        <div className="w-5 h-5 rounded-full bg-[#0C0A09] border border-white/[0.07] z-10 -ml-2.5" />
      </div>

      {/* right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-100 space-y-8">
          {/* mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-black tracking-[0.2em] text-sm uppercase">
              NAFASI
            </span>
          </div>

          <div>
            <h1 className="text-white text-3xl font-black tracking-tight leading-tight">
              Welcome back
            </h1>
            <p className="text-white/30 text-sm mt-1.5">
              Sign in to your NAFASI account
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              {/* email */}
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      htmlFor="email"
                      className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2 block">
                      Email Address
                    </FieldLabel>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="ada@example.com"
                        className="w-full pl-11 h-12 rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 focus:border-orange-500/50 focus:bg-white/6 focus:ring-2 focus:ring-orange-500/10 transition-all duration-200"
                        aria-invalid={fieldState.invalid}
                      />
                    </div>
                    {fieldState.error && (
                      <FieldError
                        errors={[fieldState.error]}
                        className="text-red-400 text-xs mt-1"
                      />
                    )}
                  </Field>
                )}
              />

              {/* password */}
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex items-center justify-between mb-2">
                      <FieldLabel
                        htmlFor="password"
                        className="text-white/60 text-xs font-semibold uppercase tracking-widest block">
                        Password
                      </FieldLabel>
                      <Link
                        href="/forgot-password"
                        className="text-orange-400 text-xs font-semibold hover:text-orange-300 hover:underline transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                      <Input
                        {...field}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-12 h-12 rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 focus:border-orange-500/50 focus:bg-white/6 focus:ring-2 focus:ring-orange-500/10 transition-all duration-200"
                        aria-invalid={fieldState.invalid}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {fieldState.error && (
                      <FieldError
                        errors={[fieldState.error]}
                        className="text-red-400 text-xs mt-1"
                      />
                    )}
                  </Field>
                )}
              />

              {/* submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {isLoading ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </FieldGroup>
          </form>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-white/25 text-xs uppercase tracking-widest">
              or
            </span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          {/* google — wired up later */}
          <button
            type="button"
            className="w-full h-12 rounded-xl border border-white/8 bg-white/3 hover:bg-white/6 text-white/70 hover:text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-200">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-white/30 text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-orange-400 font-semibold hover:text-orange-300 hover:underline transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
