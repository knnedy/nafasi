"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Ticket,
  CalendarDays,
  MapPin,
  LoaderCircle,
  CheckCircle,
  XCircle,
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

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
      .regex(/\d/, { message: "Must contain at least one number" })
      .regex(/[^A-Za-z0-9]/, {
        message: "Must contain at least one special character",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

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

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const isLoading = form.formState.isSubmitting;
  const isSubmitSuccessful = form.formState.isSubmitSuccessful;

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setInvalidToken(true);
      return;
    }

    try {
      await api.public.post("/api/v1/auth/reset-password", {
        token,
        new_password: data.newPassword,
      });
    } catch (err) {
      if (err instanceof APIError) {
        if (err.code === "INVALID_TOKEN") {
          setInvalidToken(true);
          return;
        }
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
              Almost there
            </p>
            <h2 className="text-white font-black text-5xl leading-[1.05] tracking-tight text-balance">
              Choose a{"\n"}new password{"\n"}you&apos;ll remember.
            </h2>
            <p className="text-white/40 text-base leading-relaxed max-w-sm">
              Pick something strong. Your account security matters.
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

          {/* invalid / missing token state */}
          {invalidToken ? (
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h1 className="text-white text-3xl font-black tracking-tight leading-tight">
                  Link expired
                </h1>
                <p className="text-white/30 text-sm mt-2 leading-relaxed">
                  This password reset link is invalid or has expired. Reset
                  links are only valid for 1 hour.
                </p>
              </div>
              <Link
                href="/forgot-password"
                className="w-full h-12 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2">
                Request a new link
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/signin"
                className="flex items-center justify-center text-white/30 text-sm hover:text-white/60 transition-colors">
                Back to sign in
              </Link>
            </div>
          ) : isSubmitSuccessful ? (
            /* success state */
            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <h1 className="text-white text-3xl font-black tracking-tight leading-tight">
                  Password reset
                </h1>
                <p className="text-white/30 text-sm mt-2 leading-relaxed">
                  Your password has been updated. All existing sessions have
                  been signed out for your security.
                </p>
              </div>
              <Link
                href="/signin"
                className="w-full h-12 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center gap-2">
                Sign in
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* form state */
            <>
              <div>
                <h1 className="text-white text-3xl font-black tracking-tight leading-tight">
                  Reset your password
                </h1>
                <p className="text-white/30 text-sm mt-1.5">
                  Must be at least 8 characters with uppercase, lowercase,
                  number and special character
                </p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                  {/* new password */}
                  <Controller
                    name="newPassword"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          htmlFor="newPassword"
                          className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2 block">
                          New Password
                        </FieldLabel>
                        <div className="relative">
                          <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                          <Input
                            {...field}
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Min. 8 characters"
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

                  {/* confirm password */}
                  <Controller
                    name="confirmPassword"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          htmlFor="confirmPassword"
                          className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2 block">
                          Confirm Password
                        </FieldLabel>
                        <div className="relative">
                          <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                          <Input
                            {...field}
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Repeat your password"
                            className="w-full pl-11 pr-12 h-12 rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 focus:border-orange-500/50 focus:bg-white/6 focus:ring-2 focus:ring-orange-500/10 transition-all duration-200"
                            aria-invalid={fieldState.invalid}
                          />
                          <button
                            type="button"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }>
                            {showConfirmPassword ? (
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
                        Resetting password…
                      </>
                    ) : (
                      <>
                        Reset Password
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </FieldGroup>
              </form>

              <Link
                href="/signin"
                className="flex items-center justify-center text-white/30 text-sm hover:text-white/60 transition-colors">
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
