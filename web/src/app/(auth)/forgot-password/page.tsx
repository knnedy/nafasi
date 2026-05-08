"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowRight,
  Mail,
  Ticket,
  CalendarDays,
  MapPin,
  LoaderCircle,
  ArrowLeft,
  CheckCircle,
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

const forgotPasswordSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

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

export default function ForgotPasswordPage() {
  const router = useRouter();

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const isLoading = form.formState.isSubmitting;
  const isSubmitSuccessful = form.formState.isSubmitSuccessful;

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      await api.public.post("/api/v1/auth/forgot-password", {
        email: data.email,
      });

      // backend always returns 200 regardless of whether email exists
      // so we just show the success state — no toast needed
    } catch (err) {
      if (err instanceof APIError) {
        if (err.code === "VALIDATION_ERROR") {
          toast.error(err.message);
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
              No worries
            </p>
            <h2 className="text-white font-black text-5xl leading-[1.05] tracking-tight text-balance">
              We&apos;ll get you{"\n"}back in{"\n"}no time.
            </h2>
            <p className="text-white/40 text-base leading-relaxed max-w-sm">
              Enter your email and we&apos;ll send you a link to reset your
              password.
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

          {isSubmitSuccessful ? (
            /* success state */
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <h1 className="text-white text-3xl font-black tracking-tight leading-tight">
                  Check your email
                </h1>
                <p className="text-white/30 text-sm mt-2 leading-relaxed">
                  If an account exists for{" "}
                  <span className="text-white/60 font-medium">
                    {form.getValues("email")}
                  </span>
                  , you&apos;ll receive a password reset link shortly.
                </p>
              </div>
              <p className="text-white/20 text-xs leading-relaxed">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button
                  type="button"
                  onClick={() => form.reset()}
                  className="text-orange-400 font-semibold hover:text-orange-300 hover:underline transition-colors">
                  try another email
                </button>
                .
              </p>
              <Link
                href="/signin"
                className="w-full h-12 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2">
                Back to sign in
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* form state */
            <>
              <div>
                <h1 className="text-white text-3xl font-black tracking-tight leading-tight">
                  Forgot password?
                </h1>
                <p className="text-white/30 text-sm mt-1.5">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
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

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 mt-2 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isLoading ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Sending reset link…
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </FieldGroup>
              </form>

              <Link
                href="/signin"
                className="flex items-center justify-center gap-2 text-white/30 text-sm hover:text-white/60 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
