"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  X,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAdminOrganisers } from "@/hooks/admin/use-organisers";

// Helpers
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

const STATUS_FILTERS = ["all", "pending", "approved"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

// Page
export default function AdminOrganisersPage() {
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");

  const { data: organisers = [], isLoading } = useAdminOrganisers();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return organisers.filter((o) => {
      const matchesStatus =
        activeStatus === "all" ||
        (activeStatus === "pending" && !o.is_verified) ||
        (activeStatus === "approved" && o.is_verified);
      const matchesSearch =
        q === "" ||
        o.name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [search, activeStatus, organisers]);

  const pendingCount = useMemo(
    () => organisers.filter((o) => !o.is_verified).length,
    [organisers],
  );
  const approvedCount = useMemo(
    () => organisers.filter((o) => o.is_verified).length,
    [organisers],
  );

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
        <h1 className="text-white font-black text-3xl tracking-tight">
          Organisers
        </h1>
        <p className="text-white/30 text-sm mt-1">
          {organisers.length} total · {approvedCount} approved · {pendingCount}{" "}
          pending
        </p>
      </div>

      {/* pending callout — shown when there are pending organisers */}
      {pendingCount > 0 && activeStatus !== "approved" && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/6 border border-amber-500/15">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-amber-400/90 text-sm font-bold">
              {pendingCount} organiser{pendingCount === 1 ? "" : "s"} awaiting
              verification
            </p>
            <p className="text-amber-400/50 text-xs mt-0.5">
              Review and approve their accounts to allow event publishing.
            </p>
          </div>
          <button
            onClick={() => setActiveStatus("pending")}
            className="shrink-0 text-amber-400/70 hover:text-amber-400 text-xs font-bold transition-colors">
            View pending
          </button>
        </div>
      )}

      {/* search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
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
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map((f) => {
          const count =
            f === "pending"
              ? pendingCount
              : f === "approved"
                ? approvedCount
                : organisers.length;
          return (
            <button
              key={f}
              onClick={() => setActiveStatus(f)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 capitalize ${
                activeStatus === f
                  ? "bg-orange-500/15 border border-orange-500/30 text-orange-400"
                  : "text-white/35 hover:text-white/60 hover:bg-white/4"
              }`}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 text-white/20">{count}</span>
            </button>
          );
        })}
        <span className="text-white/20 text-xs ml-auto shrink-0">
          {filtered.length} {filtered.length === 1 ? "organiser" : "organisers"}
        </span>
      </div>

      {/* list */}
      {organisers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-white/15" />
          </div>
          <p className="text-white/20 text-sm">No organisers yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-white/15" />
          </div>
          <p className="text-white/20 text-sm">No organisers found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
          {filtered.map((organiser, i) => (
            <Link
              key={organiser.id}
              href={`/dashboard/admin/users/${organiser.id}`}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors group ${
                i < filtered.length - 1 ? "border-b border-white/4" : ""
              }`}>
              <UserInitials name={organiser.name} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white/80 text-sm font-bold truncate leading-tight">
                    {organiser.name}
                  </p>
                  {organiser.status === "BANNED" && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
                      Banned
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-white/30 text-xs truncate">
                    {organiser.email}
                  </span>
                  <span className="text-white/20 text-xs">·</span>
                  <span className="text-white/20 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(organiser.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {organiser.is_verified ? (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border bg-amber-500/10 border-amber-500/20 text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Pending
                  </span>
                )}
              </div>

              <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-white/35 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* empty pending state */}
      {activeStatus === "pending" &&
        filtered.length === 0 &&
        !search &&
        organisers.length > 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-400/50" />
            </div>
            <p className="text-white/30 text-sm">
              All organisers are verified.
            </p>
          </div>
        )}
    </div>
  );
}
