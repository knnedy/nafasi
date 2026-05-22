"use client";

import { CheckCircle, Mail, Shield, Ticket, User } from "lucide-react";
import { useAuthStore } from "@/store/auth";

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

// Helpers
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// User avatar — large
function UserAvatar({ name, url }: { name: string; url?: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-24 h-24 rounded-full object-cover border-2 border-orange-500/30"
      />
    );
  }

  return (
    <div className="w-24 h-24 rounded-full bg-linear-to-br from-orange-500/80 to-amber-500/80 flex items-center justify-center text-white text-3xl font-black border-2 border-orange-500/30">
      {initials}
    </div>
  );
}

// Info row
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-white/6 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-white/4 border border-white/6 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-white/30" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/35 text-xs font-bold uppercase tracking-widest">
          {label}
        </p>
        <p className="text-white/80 text-sm font-semibold mt-0.5 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

// Profile page
export default function ProfilePage() {
  const { user } = useAuthStore();
  const currentUser = user ?? MOCK_USER;

  return (
    <div className="space-y-6">
      {/* page header */}
      <div>
        <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
          Account
        </p>
        <h1 className="text-white font-black text-3xl tracking-tight">
          Profile
        </h1>
        <p className="text-white/30 text-sm mt-1">
          Your personal information and account details.
        </p>
      </div>

      {/* avatar + identity */}
      <div className="rounded-2xl border border-white/8 bg-white/2 p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <UserAvatar
            name={currentUser.name}
            url={currentUser.avatar_url ?? ""}
          />
          <div className="space-y-2">
            <h2 className="text-white font-black text-2xl tracking-tight leading-tight">
              {currentUser.name}
            </h2>
            <p className="text-white/40 text-sm">{currentUser.email}</p>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">
                {currentUser.role.toLowerCase()}
              </span>
              {currentUser.is_verified && (
                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
          </div>

          {/* member since — push right on sm+ */}
          <div className="sm:ml-auto text-left sm:text-right shrink-0">
            <p className="text-white/20 text-xs font-semibold uppercase tracking-widest">
              Member since
            </p>
            <p className="text-white/60 text-sm font-bold mt-1">
              {formatDate(currentUser.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* account details */}
      <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
        <div className="px-6 py-5 border-b border-white/6">
          <h2 className="text-white font-black text-base tracking-tight">
            Account Details
          </h2>
          <p className="text-white/30 text-xs mt-0.5">
            Your registered account information.
          </p>
        </div>
        <div className="px-6">
          <InfoRow icon={User} label="Full Name" value={currentUser.name} />
          <InfoRow
            icon={Mail}
            label="Email Address"
            value={currentUser.email}
          />
          <InfoRow
            icon={Ticket}
            label="Role"
            value={
              currentUser.role.charAt(0) +
              currentUser.role.slice(1).toLowerCase()
            }
          />
          <InfoRow
            icon={Shield}
            label="Account Status"
            value={currentUser.is_verified ? "Verified" : "Unverified"}
          />
          <InfoRow
            icon={Shield}
            label="Member Since"
            value={formatDate(currentUser.created_at)}
          />
        </div>
      </div>

      {/* quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          href="/profile/orders"
          className="group flex items-center gap-4 p-5 rounded-2xl border border-white/8 bg-white/2 hover:bg-white/4 hover:border-white/12 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <Ticket className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">My Orders</p>
            <p className="text-white/30 text-xs mt-0.5">
              View tickets & purchases
            </p>
          </div>
        </a>
        <a
          href="/profile/settings"
          className="group flex items-center gap-4 p-5 rounded-2xl border border-white/8 bg-white/2 hover:bg-white/4 hover:border-white/12 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white/40" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Settings</p>
            <p className="text-white/30 text-xs mt-0.5">
              Password & account actions
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}
