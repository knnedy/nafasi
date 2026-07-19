"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  X,
  CheckCircle,
  XCircle,
  Circle,
  ShieldCheck,
  Ticket,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { useAdminUsers } from "@/hooks/admin/use-users";

// Helpers
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
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
      return {
        label: "Active",
        cls: "text-emerald-400",
        icon: CheckCircle,
      };
    case "BANNED":
      return {
        label: "Banned",
        cls: "text-red-400",
        icon: XCircle,
      };
    case "DELETED":
      return {
        label: "Deleted",
        cls: "text-white/25",
        icon: Circle,
      };
    default:
      return {
        label: status,
        cls: "text-white/25",
        icon: Circle,
      };
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
    <div className="w-9 h-9 rounded-full bg-linear-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/15 flex items-center justify-center text-orange-300 text-xs font-black shrink-0">
      {initials}
    </div>
  );
}

const ROLE_FILTERS = ["All", "ATTENDEE", "ORGANISER", "ADMIN"] as const;
const STATUS_FILTERS = ["All", "ACTIVE", "BANNED", "DELETED"] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];
type StatusFilter = (typeof STATUS_FILTERS)[number];

// Page
export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState<RoleFilter>("All");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("All");

  const { data: users = [], isLoading } = useAdminUsers();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = activeRole === "All" || u.role === activeRole;
      const matchesStatus = activeStatus === "All" || u.status === activeStatus;
      const matchesSearch =
        q === "" ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);
      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [search, activeRole, activeStatus, users]);

  const roleCounts = useMemo(() => {
    return users.reduce<Record<string, number>>((acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    }, {});
  }, [users]);

  const statusCounts = useMemo(() => {
    return users.reduce<Record<string, number>>((acc, u) => {
      acc[u.status] = (acc[u.status] ?? 0) + 1;
      return acc;
    }, {});
  }, [users]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-white/30 text-sm font-semibold">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
          Admin
        </p>
        <h1 className="text-white font-black text-3xl tracking-tight">Users</h1>
        <p className="text-white/30 text-sm mt-1">
          {users.length} total · {roleCounts["ORGANISER"] ?? 0} organisers ·{" "}
          {statusCounts["BANNED"] ?? 0} banned
        </p>
      </div>

      {/* search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or ID…"
          className="w-full h-11 pl-11 pr-10 rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/6 transition-all duration-200"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* filters */}
      <div className="space-y-2">
        {/* role filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveRole(f)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeRole === f
                  ? "bg-orange-500/15 border border-orange-500/30 text-orange-400"
                  : "text-white/35 hover:text-white/60 hover:bg-white/4"
              }`}>
              {f === "All"
                ? "All roles"
                : f.charAt(0) + f.slice(1).toLowerCase()}
              {f !== "All" && (roleCounts[f] ?? 0) > 0 && (
                <span className="ml-1.5 text-white/20">{roleCounts[f]}</span>
              )}
            </button>
          ))}
        </div>

        {/* status filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveStatus(f)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeStatus === f
                  ? "bg-white/10 border border-white/20 text-white/80"
                  : "text-white/35 hover:text-white/60 hover:bg-white/4"
              }`}>
              {f === "All"
                ? "All statuses"
                : f.charAt(0) + f.slice(1).toLowerCase()}
              {f !== "All" && (statusCounts[f] ?? 0) > 0 && (
                <span className="ml-1.5 text-white/20">{statusCounts[f]}</span>
              )}
            </button>
          ))}
          <span className="text-white/20 text-xs ml-auto shrink-0">
            {filtered.length} {filtered.length === 1 ? "user" : "users"}
          </span>
        </div>
      </div>

      {/* list */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-white/15" />
          </div>
          <p className="text-white/20 text-sm">No users yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-white/15" />
          </div>
          <p className="text-white/20 text-sm">No users found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
          {filtered.map((user, i) => {
            const rc = roleConfig(user.role);
            const sc = statusConfig(user.status);
            const RoleIcon = rc.icon;
            const StatusIcon = sc.icon;

            return (
              <Link
                key={user.id}
                href={`/dashboard/admin/users/${user.id}`}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors group ${
                  i < filtered.length - 1 ? "border-b border-white/4" : ""
                }`}>
                <UserInitials name={user.name} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white/80 text-sm font-bold truncate leading-tight">
                      {user.name}
                    </p>
                    {user.role === "ORGANISER" && !user.is_verified && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-white/30 text-xs truncate">
                      {user.email}
                    </span>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-white/20 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
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
                </div>

                <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-white/35 transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
