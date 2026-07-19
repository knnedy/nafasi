"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  X,
  CheckCircle,
  XCircle,
  Circle,
  Clock,
  CalendarDays,
  MapPin,
  Wifi,
  ArrowUpRight,
} from "lucide-react";
import { useAdminEvents } from "@/hooks/admin/use-events";

// Helpers
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusConfig(status: string) {
  switch (status) {
    case "PUBLISHED":
      return {
        label: "Published",
        cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        icon: CheckCircle,
      };
    case "DRAFT":
      return {
        label: "Draft",
        cls: "bg-white/6 border-white/10 text-white/40",
        icon: Circle,
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        cls: "bg-red-500/10 border-red-500/20 text-red-400",
        icon: XCircle,
      };
    case "COMPLETED":
      return {
        label: "Completed",
        cls: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        icon: CheckCircle,
      };
    default:
      return {
        label: status,
        cls: "bg-white/6 border-white/10 text-white/40",
        icon: Circle,
      };
  }
}

const STATUS_FILTERS = [
  "All",
  "PUBLISHED",
  "DRAFT",
  "CANCELLED",
  "COMPLETED",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

// Page
export default function AdminEventsPage() {
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("All");

  const { data: events = [], isLoading } = useAdminEvents();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      const matchesStatus = activeStatus === "All" || e.status === activeStatus;
      const matchesSearch =
        q === "" ||
        e.title.toLowerCase().includes(q) ||
        e.organiser_name.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [search, activeStatus, events]);

  const statusCounts = useMemo(() => {
    return events.reduce<Record<string, number>>((acc, e) => {
      acc[e.status] = (acc[e.status] ?? 0) + 1;
      return acc;
    }, {});
  }, [events]);

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
          Events
        </h1>
        <p className="text-white/30 text-sm mt-1">
          {events.length} total · {statusCounts["PUBLISHED"] ?? 0} published ·{" "}
          {statusCounts["DRAFT"] ?? 0} draft
        </p>
      </div>

      {/* search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, organiser, venue…"
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
          const count = f === "All" ? events.length : (statusCounts[f] ?? 0);
          return (
            <button
              key={f}
              onClick={() => setActiveStatus(f)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeStatus === f
                  ? "bg-orange-500/15 border border-orange-500/30 text-orange-400"
                  : "text-white/35 hover:text-white/60 hover:bg-white/4"
              }`}>
              {f === "All" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              {count > 0 && (
                <span className="ml-1.5 text-white/20">{count}</span>
              )}
            </button>
          );
        })}
        <span className="text-white/20 text-xs ml-auto shrink-0">
          {filtered.length} {filtered.length === 1 ? "event" : "events"}
        </span>
      </div>

      {/* list */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
            <CalendarDays className="w-6 h-6 text-white/15" />
          </div>
          <p className="text-white/20 text-sm">No events yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
            <CalendarDays className="w-6 h-6 text-white/15" />
          </div>
          <p className="text-white/20 text-sm">No events found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
          {filtered.map((event, i) => {
            const sc = statusConfig(event.status);
            const StatusIcon = sc.icon;

            return (
              <Link
                key={event.id}
                href={`/dashboard/admin/events/${event.id}`}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors group ${
                  i < filtered.length - 1 ? "border-b border-white/4" : ""
                }`}>
                {/* date block */}
                <div className="w-10 h-10 rounded-xl bg-white/4 border border-white/6 flex flex-col items-center justify-center shrink-0">
                  <span className="text-white/70 font-black text-sm leading-none">
                    {new Date(event.starts_at).getDate()}
                  </span>
                  <span className="text-white/25 text-[9px] font-bold tracking-widest mt-0.5">
                    {new Date(event.starts_at)
                      .toLocaleDateString("en-KE", { month: "short" })
                      .toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm font-bold truncate leading-tight">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-white/30 text-xs">
                      {event.organiser_name}
                    </span>
                    <span className="text-white/20 text-xs">·</span>
                    {event.is_online ? (
                      <span className="text-white/25 text-xs flex items-center gap-1">
                        <Wifi className="w-3 h-3" />
                        Online
                      </span>
                    ) : (
                      (event.venue || event.location) && (
                        <span className="text-white/25 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-32">
                            {event.venue || event.location}
                          </span>
                        </span>
                      )
                    )}
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-white/20 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(event.starts_at)}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ${sc.cls}`}>
                  <StatusIcon className="w-2.5 h-2.5" />
                  {sc.label}
                </span>

                <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-white/35 transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
