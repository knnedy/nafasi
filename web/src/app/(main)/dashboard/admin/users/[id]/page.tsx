"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Circle,
  ShieldCheck,
  Ticket,
  Users,
  Clock,
  Mail,
  Hash,
  AlertTriangle,
  LoaderCircle,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { APIError } from "@/lib/api";
import {
  useAdminUser,
  useUpdateUserVerification,
  useBanUser,
  useUnbanUser,
  usePromoteToAdmin,
  useDeleteUser,
} from "@/hooks/admin/use-users";

// Helpers
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function roleConfig(role: string) {
  switch (role) {
    case "ADMIN":
      return {
        label: "Admin",
        cls: "bg-red-500/10 border-red-500/20 text-red-400",
        icon: ShieldCheck,
      };
    case "ORGANISER":
      return {
        label: "Organiser",
        cls: "bg-orange-500/10 border-orange-500/20 text-orange-400",
        icon: Ticket,
      };
    default:
      return {
        label: "Attendee",
        cls: "bg-white/6 border-white/10 text-white/40",
        icon: Users,
      };
  }
}

function statusConfig(status: string) {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", cls: "text-emerald-400", icon: CheckCircle };
    case "BANNED":
      return { label: "Banned", cls: "text-red-400", icon: XCircle };
    case "DELETED":
      return { label: "Deleted", cls: "text-white/25", icon: Circle };
    default:
      return { label: status, cls: "text-white/25", icon: Circle };
  }
}

function UserInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/15 flex items-center justify-center text-orange-300 text-xl font-black shrink-0">
      {initials}
    </div>
  );
}

// Confirm dialog
function ConfirmAction({
  title,
  description,
  confirmLabel,
  confirmCls,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmCls: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/4 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-bold text-sm">{title}</p>
          <p className="text-white/40 text-xs mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="h-9 px-4 rounded-lg text-white/40 hover:text-white/70 text-xs font-bold transition-colors disabled:opacity-40">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`h-9 px-4 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-40 ${confirmCls}`}>
          {loading && <LoaderCircle className="w-3.5 h-3.5 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

// Action card
function ActionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-4">
      {children}
    </div>
  );
}

function errorMessage(err: unknown) {
  if (err instanceof APIError) return err.message;
  return "Something went wrong. Please try again.";
}

// Page
export default function AdminUserDetailPage() {
  const { id: userId } = useParams<{ id: string }>();
  const router = useRouter();

  const [confirmingPromote, setConfirmingPromote] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { data: user, isLoading } = useAdminUser(userId);

  const verifyMutation = useUpdateUserVerification(userId);
  const banMutation = useBanUser(userId);
  const unbanMutation = useUnbanUser(userId);
  const promoteMutation = usePromoteToAdmin(userId);
  const deleteMutation = useDeleteUser(userId);

  const handleVerification = async (isVerified: boolean) => {
    try {
      await verifyMutation.mutateAsync(isVerified);
      toast.success(
        isVerified ? "Organiser verified." : "Verification revoked.",
      );
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handleBan = async () => {
    try {
      await banMutation.mutateAsync();
      toast.success("User banned.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handleUnban = async () => {
    try {
      await unbanMutation.mutateAsync();
      toast.success("User unbanned.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handlePromote = async () => {
    try {
      await promoteMutation.mutateAsync();
      setConfirmingPromote(false);
      toast.success(`${user?.name} promoted to Admin.`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync();
      toast.success("User deleted.");
      router.push("/dashboard/admin/users");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-white/30 text-sm font-semibold">Loading...</p>
      </div>
    );
  }

  const rc = roleConfig(user.role);
  const sc = statusConfig(user.status);
  const RoleIcon = rc.icon;
  const StatusIcon = sc.icon;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* back */}
      <div>
        <Link
          href="/dashboard/admin/users"
          className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-sm font-semibold transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          All users
        </Link>

        <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
          User
        </p>
        <h1 className="text-white font-black text-3xl tracking-tight">
          {user.name}
        </h1>
      </div>

      {/* profile card */}
      <div className="rounded-2xl border border-white/8 bg-white/2 p-6 space-y-5">
        <div className="flex items-start gap-4">
          <UserInitials name={user.name} />
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 ${rc.cls}`}>
                <RoleIcon className="w-2.5 h-2.5" />
                {rc.label}
              </span>
              <span
                className={`text-xs font-bold flex items-center gap-1 ${sc.cls}`}>
                <StatusIcon className="w-3 h-3" />
                {sc.label}
              </span>
              {user.role === "ORGANISER" && (
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    user.is_verified
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  }`}>
                  {user.is_verified ? (
                    <CheckCircle className="w-2.5 h-2.5" />
                  ) : (
                    <AlertTriangle className="w-2.5 h-2.5" />
                  )}
                  {user.is_verified ? "Verified" : "Pending"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3">
            <Mail className="w-3.5 h-3.5 text-white/20 shrink-0" />
            <p className="text-white/60 text-sm">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Hash className="w-3.5 h-3.5 text-white/20 shrink-0" />
            <p className="text-white/30 text-xs font-mono">{user.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-3.5 h-3.5 text-white/20 shrink-0" />
            <p className="text-white/30 text-xs">
              Joined {formatDate(user.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="space-y-4">
        <h2 className="text-white font-black text-base tracking-tight">
          Actions
        </h2>

        {/* verification — organiser only */}
        {user.role === "ORGANISER" && (
          <ActionCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white font-bold text-sm">
                  Organiser Verification
                </p>
                <p className="text-white/30 text-xs mt-1 leading-relaxed">
                  {user.is_verified
                    ? "This organiser is verified and can publish events."
                    : "This organiser is pending verification. Approve to allow event publishing."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleVerification(!user.is_verified)}
                disabled={verifyMutation.isPending}
                className={`shrink-0 h-9 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 disabled:opacity-40 ${
                  user.is_verified
                    ? "bg-white/6 border border-white/10 text-white/60 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15"
                }`}>
                {verifyMutation.isPending && (
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                )}
                {user.is_verified ? "Revoke verification" : "Verify organiser"}
              </button>
            </div>
          </ActionCard>
        )}

        {/* ban / unban — not for admins or deleted users */}
        {user.role !== "ADMIN" && user.status !== "DELETED" && (
          <ActionCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white font-bold text-sm">
                  {user.status === "BANNED" ? "Unban User" : "Ban User"}
                </p>
                <p className="text-white/30 text-xs mt-1 leading-relaxed">
                  {user.status === "BANNED"
                    ? "Restore access for this user. They will be able to sign in again."
                    : "Prevent this user from signing in or using the platform."}
                </p>
              </div>
              <button
                type="button"
                onClick={user.status === "BANNED" ? handleUnban : handleBan}
                disabled={banMutation.isPending || unbanMutation.isPending}
                className={`shrink-0 h-9 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 disabled:opacity-40 ${
                  user.status === "BANNED"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15"
                    : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15"
                }`}>
                {(banMutation.isPending || unbanMutation.isPending) && (
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                )}
                {user.status === "BANNED" ? "Unban user" : "Ban user"}
              </button>
            </div>
          </ActionCard>
        )}

        {/* promote — attendees and organisers only, not already admin */}
        {user.role !== "ADMIN" && user.status === "ACTIVE" && (
          <div className="space-y-3">
            {confirmingPromote ? (
              <ConfirmAction
                title={`Promote ${user.name} to Admin?`}
                description="This grants full platform access and cannot be undone. The user's role will change to Admin immediately."
                confirmLabel="Promote to Admin"
                confirmCls="bg-orange-500/15 border border-orange-500/25 text-orange-400 hover:bg-orange-500/20"
                onConfirm={handlePromote}
                onCancel={() => setConfirmingPromote(false)}
                loading={promoteMutation.isPending}
              />
            ) : (
              <ActionCard>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white font-bold text-sm">
                      Promote to Admin
                    </p>
                    <p className="text-white/30 text-xs mt-1 leading-relaxed">
                      Grant this user full admin access to the platform. This
                      action cannot be undone.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmingPromote(true)}
                    className="shrink-0 h-9 px-4 rounded-xl bg-white/6 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 text-xs font-bold transition-all duration-200 flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Promote
                  </button>
                </div>
              </ActionCard>
            )}
          </div>
        )}

        {/* delete */}
        <div className="space-y-3">
          {confirmingDelete ? (
            <ConfirmAction
              title={`Delete ${user.name}?`}
              description="This permanently removes the user's account. Any associated orders and data will be affected. This cannot be undone."
              confirmLabel="Delete user"
              confirmCls="bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/20"
              onConfirm={handleDelete}
              onCancel={() => setConfirmingDelete(false)}
              loading={deleteMutation.isPending}
            />
          ) : (
            <ActionCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white font-bold text-sm">Delete Account</p>
                  <p className="text-white/30 text-xs mt-1 leading-relaxed">
                    Permanently delete this user&apos;s account. This cannot be
                    undone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="shrink-0 h-9 px-4 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400/60 hover:text-red-400 hover:bg-red-500/15 text-xs font-bold transition-all duration-200">
                  Delete
                </button>
              </div>
            </ActionCard>
          )}
        </div>
      </div>
    </div>
  );
}
