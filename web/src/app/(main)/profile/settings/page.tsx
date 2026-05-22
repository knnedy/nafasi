"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Mail,
  Shield,
  Camera,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Trash2,
  AlertTriangle,
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
import Image from "next/image";

// Schemas
const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100),
  email: z.email({ message: "Invalid email address" }),
});

const updatePasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
      .regex(/\d/, { message: "Must contain at least one number" })
      .regex(/[^A-Za-z0-9]/, {
        message: "Must contain at least one special character",
      }),
    new_password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
      .regex(/\d/, { message: "Must contain at least one number" })
      .regex(/[^A-Za-z0-9]/, {
        message: "Must contain at least one special character",
      }),
  })
  .refine((d) => d.current_password !== d.new_password, {
    message: "New password must be different from current password",
    path: ["new_password"],
  });

const updateAvatarSchema = z.object({
  avatar_url: z.string().url({ message: "Must be a valid URL" }),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;
type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>;
type UpdateAvatarForm = z.infer<typeof updateAvatarSchema>;

// Mock user
const MOCK_USER = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Ada Okonkwo",
  email: "ada@example.com",
  role: "ATTENDEE" as const,
  is_verified: true,
  avatar_url: "",
  created_at: "2026-01-15T10:00:00Z",
};

// User avatar preview
function AvatarPreview({ name, url }: { name: string; url?: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        className="w-16 h-16 rounded-full object-cover border-2 border-orange-500/30 shrink-0"
      />
    );
  }

  return (
    <div className="w-16 h-16 rounded-full bg-linear-to-br from-orange-500/80 to-amber-500/80 flex items-center justify-center text-white text-lg font-black border-2 border-orange-500/30 shrink-0">
      {initials}
    </div>
  );
}

// Section wrapper
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
      <div className="px-6 py-5 border-b border-white/6">
        <h2 className="text-white font-black text-base tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-white/30 text-xs mt-0.5">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// Settings page
export default function SettingsPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const { user, setAuth, clearAuth } = useAuthStore();
  const currentUser = user ?? MOCK_USER;

  const profileForm = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: currentUser.name,
      email: currentUser.email,
    },
  });

  const passwordForm = useForm<UpdatePasswordForm>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { current_password: "", new_password: "" },
  });

  const avatarForm = useForm<UpdateAvatarForm>({
    resolver: zodResolver(updateAvatarSchema),
    defaultValues: { avatar_url: currentUser.avatar_url ?? "" },
  });

  const isProfileLoading = profileForm.formState.isSubmitting;
  const isPasswordLoading = passwordForm.formState.isSubmitting;
  const isAvatarLoading = avatarForm.formState.isSubmitting;

  const onUpdateProfile = async (data: UpdateProfileForm) => {
    try {
      const res = await api.patch("/api/v1/users/me", data);
      const json = await res.json();
      if (user) setAuth(json.data, useAuthStore.getState().accessToken!);
      toast.success("Profile updated successfully.");
    } catch (err) {
      if (err instanceof APIError) {
        if (err.code === "EMAIL_ALREADY_EXISTS") {
          profileForm.setError("email", {
            message: "An account with this email already exists.",
          });
          return;
        }
        toast.error(err.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  };

  const onUpdatePassword = async (data: UpdatePasswordForm) => {
    try {
      await api.patch("/api/v1/users/me/password", {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success("Password updated successfully.");
      passwordForm.reset();
    } catch (err) {
      if (err instanceof APIError) {
        if (err.code === "INVALID_CREDENTIALS") {
          passwordForm.setError("current_password", {
            message: "Current password is incorrect.",
          });
          return;
        }
        toast.error(err.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  };

  const onUpdateAvatar = async (data: UpdateAvatarForm) => {
    try {
      const res = await api.patch("/api/v1/users/me/avatar", data);
      const json = await res.json();
      if (user) setAuth(json.data, useAuthStore.getState().accessToken!);
      toast.success("Avatar updated successfully.");
    } catch (err) {
      if (err instanceof APIError) {
        toast.error(err.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  };

  const onDeleteAccount = async () => {
    if (deleteInput !== currentUser.email) return;
    try {
      await api.delete("/api/v1/users/me");
      clearAuth();
      window.location.href = "/";
    } catch (err) {
      if (err instanceof APIError) {
        toast.error(err.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* page header */}
      <div>
        <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
          Account
        </p>
        <h1 className="text-white font-black text-3xl tracking-tight">
          Settings
        </h1>
        <p className="text-white/30 text-sm mt-1">
          Manage your profile, password and account preferences.
        </p>
      </div>

      {/* personal information */}
      <Section
        title="Personal Information"
        description="Update your name and email address.">
        <form onSubmit={profileForm.handleSubmit(onUpdateProfile)}>
          <FieldGroup className="space-y-4">
            <Controller
              name="name"
              control={profileForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-white/60 text-xs font-black uppercase tracking-widest mb-2 block">
                    Full Name
                  </FieldLabel>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <Input
                      {...field}
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
            <Controller
              name="email"
              control={profileForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-white/60 text-xs font-black uppercase tracking-widest mb-2 block">
                    Email Address
                  </FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <Input
                      {...field}
                      type="email"
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
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isProfileLoading}
                className="h-11 px-6 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {isProfileLoading ? (
                  <>
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </FieldGroup>
        </form>
      </Section>

      {/* avatar */}
      <Section
        title="Avatar"
        description="Update your profile picture via a URL.">
        <form onSubmit={avatarForm.handleSubmit(onUpdateAvatar)}>
          <FieldGroup className="space-y-4">
            <div className="flex items-center gap-4">
              <AvatarPreview
                name={currentUser.name}
                url={avatarForm.watch("avatar_url") || currentUser.avatar_url}
              />
              <div className="flex-1 min-w-0">
                <Controller
                  name="avatar_url"
                  control={avatarForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="text-white/60 text-xs font-black uppercase tracking-widest mb-2 block">
                        Image URL
                      </FieldLabel>
                      <div className="relative">
                        <Camera className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://example.com/avatar.jpg"
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
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isAvatarLoading}
                className="h-11 px-6 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {isAvatarLoading ? (
                  <>
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Update avatar
                  </>
                )}
              </button>
            </div>
          </FieldGroup>
        </form>
      </Section>

      {/* change password */}
      <Section
        title="Change Password"
        description="Use a strong password you haven't used before.">
        <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)}>
          <FieldGroup className="space-y-4">
            <Controller
              name="current_password"
              control={passwordForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-white/60 text-xs font-black uppercase tracking-widest mb-2 block">
                    Current Password
                  </FieldLabel>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <Input
                      {...field}
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 h-12 rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 focus:border-orange-500/50 focus:bg-white/6 focus:ring-2 focus:ring-orange-500/10 transition-all duration-200"
                      aria-invalid={fieldState.invalid}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors">
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
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
            <Controller
              name="new_password"
              control={passwordForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-white/60 text-xs font-black uppercase tracking-widest mb-2 block">
                    New Password
                  </FieldLabel>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <Input
                      {...field}
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      className="w-full pl-11 pr-12 h-12 rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 focus:border-orange-500/50 focus:bg-white/6 focus:ring-2 focus:ring-orange-500/10 transition-all duration-200"
                      aria-invalid={fieldState.invalid}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors">
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
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
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isPasswordLoading}
                className="h-11 px-6 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {isPasswordLoading ? (
                  <>
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Update password
                  </>
                )}
              </button>
            </div>
          </FieldGroup>
        </form>
      </Section>

      {/* danger zone */}
      <Section
        title="Danger Zone"
        description="Permanent and irreversible actions.">
        {!deleteConfirm ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm font-semibold">
                Delete account
              </p>
              <p className="text-white/30 text-xs mt-0.5">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="h-10 px-4 rounded-xl font-bold text-sm text-red-400/80 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/6 transition-all duration-200 flex items-center gap-2 shrink-0">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/6 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm font-bold">
                  This action cannot be undone.
                </p>
                <p className="text-white/40 text-xs mt-0.5 leading-relaxed">
                  All your data, tickets, and account information will be
                  permanently deleted. Type your email address to confirm.
                </p>
              </div>
            </div>
            <input
              type="email"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={currentUser.email}
              className="w-full h-11 px-4 rounded-xl bg-white/4 border border-red-500/20 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-red-500/40 transition-all duration-200"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setDeleteConfirm(false);
                  setDeleteInput("");
                }}
                className="h-10 px-4 rounded-xl font-bold text-sm text-white/40 hover:text-white border border-white/8 hover:bg-white/4 transition-all duration-200">
                Cancel
              </button>
              <button
                onClick={onDeleteAccount}
                disabled={deleteInput !== currentUser.email}
                className="h-10 px-4 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-400 transition-all duration-200 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
                <Trash2 className="w-4 h-4" />
                Confirm deletion
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
