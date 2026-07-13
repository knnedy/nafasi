"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Wifi,
  Plus,
  ArrowUpRight,
  CheckCircle,
  Circle,
  XCircle,
  AlertCircle,
  Ticket,
  TrendingUp,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { accentForId, formatPrice } from "@/lib/utils";
import { useOrganiserEvents, useAllEventsStats } from "@/hooks/use-organiser";

// Helpers
function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Status config
function statusConfig(status: string) {
  switch (status?.toUpperCase()) {
    case "PUBLISHED":
      return {
        label: "Published",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        icon: CheckCircle,
      };
    case "DRAFT":
      return {
        label: "Draft",
        color: "text-white/40",
        bg: "bg-white/4 border-white/8",
        icon: Circle,
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/20",
        icon: XCircle,
      };
    case "COMPLETED":
      return {
        label: "Completed",
        color: "text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/20",
        icon: CheckCircle,
      };
    default:
      return {
        label: status || "Unknown",
        color: "text-white/40",
        bg: "bg-white/4 border-white/8",
        icon: AlertCircle,
      };
  }
}

const FILTERS = [
  "All",
  "Published",
  "Draft",
  "Completed",
  "Cancelled",
] as const;
type Filter = (typeof FILTERS)[number];

// Events page
export default function OrganiserEventsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");

  // 1. Fetch real events
  const { data: events = [], isLoading: isEventsLoading } =
    useOrganiserEvents();

  // 2. Fetch stats in parallel for all loaded events
  const statsQueries = useAllEventsStats(events);

  // 3. Build a lookup map for easy access in the render loop
  const statsLookup = useMemo(() => {
    const lookup: Record<
      string,
      { tickets_sold: number; revenue: number; orders: number }
    > = {};

    statsQueries.forEach((q) => {
      if (q.data) {
        lookup[q.data.eventId] = {
          tickets_sold: q.data.tickets_sold,
          revenue: q.data.revenue,
          orders: q.data.orders,
        };
      }
    });

    return lookup;
  }, [statsQueries]);

  // 4. Client-side filtering
  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesFilter =
        activeFilter === "All" || e.status === activeFilter.toUpperCase();
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        e.title.toLowerCase().includes(q) ||
        (e.venue?.toLowerCase() || "").includes(q) ||
        (e.location?.toLowerCase() || "").includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [events, activeFilter, search]);

  const publishedCount = useMemo(() => {
    return events.filter((e) => e.status === "PUBLISHED").length;
  }, [events]);

  return (
    <div className="space-y-6">
      {/* page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
            Dashboard
          </p>
          <h1 className="text-white font-black text-3xl tracking-tight">
            Events
          </h1>
          <p className="text-white/30 text-sm mt-1">
            {events.length} total · {publishedCount} published
          </p>
        </div>
        <Link
          href="/dashboard/organiser/events/new"
          className="shrink-0 h-10 px-4 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New event
        </Link>
      </div>

      {/* search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
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

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeFilter === f
                  ? "bg-orange-500/15 border border-orange-500/30 text-orange-400"
                  : "text-white/35 hover:text-white/60 hover:bg-white/4"
              }`}>
              {f}
            </button>
          ))}
          <span className="text-white/20 text-xs ml-auto shrink-0">
            {filtered.length} {filtered.length === 1 ? "event" : "events"}
          </span>
        </div>
      </div>

      {/* events list */}
      {isEventsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-white/40 font-bold text-sm tracking-widest uppercase">
            Loading Events
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
            <CalendarDays className="w-6 h-6 text-white/15" />
          </div>
          <p className="text-white/20 text-sm">No events found.</p>
          <Link
            href="/dashboard/organiser/events/new"
            className="text-orange-400 hover:text-orange-300 text-xs font-bold mt-3 transition-colors">
            Create your first event →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => {
            const accent = accentForId(event.id);
            // Default stats to 0 if the query is still loading
            const stats = statsLookup[event.id] || {
              tickets_sold: 0,
              revenue: 0,
              orders: 0,
            };
            const sc = statusConfig(event.status);
            const StatusIcon = sc.icon;

            return (
              <Link
                key={event.id}
                href={`/dashboard/organiser/events/${event.id}`}
                className="group flex items-center gap-0 rounded-2xl border border-white/6 bg-white/2 hover:bg-white/4 hover:border-white/10 overflow-hidden transition-all duration-200">
                {/* accent left stripe */}
                <div
                  className="w-1 self-stretch shrink-0"
                  style={{ background: accent }}
                />

                {/* date block */}
                <div className="px-4 py-5 shrink-0">
                  <div
                    className="w-12 h-12 rounded-xl flex flex-col items-center justify-center"
                    style={{
                      background: `${accent}12`,
                      border: `1px solid ${accent}20`,
                    }}>
                    <span
                      className="font-black text-base leading-none"
                      style={{ color: accent }}>
                      {new Date(event.starts_at).getDate()}
                    </span>
                    <span
                      className="text-[9px] font-bold tracking-wider mt-0.5"
                      style={{ color: `${accent}80` }}>
                      {new Date(event.starts_at)
                        .toLocaleDateString("en-KE", { month: "short" })
                        .toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* main info */}
                <div className="flex-1 py-5 pr-4 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${sc.bg} ${sc.color}`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {sc.label}
                    </span>
                  </div>
                  <p className="text-white font-bold text-base leading-tight truncate group-hover:text-orange-50 transition-colors">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-white/30 text-xs flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {formatDate(event.starts_at)} ·{" "}
                      {formatTime(event.starts_at)}
                    </span>
                    {event.is_online ? (
                      <span className="text-emerald-500/60 text-xs flex items-center gap-1">
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
                  </div>
                </div>

                {/* stats */}
                <div className="hidden sm:flex items-center gap-6 px-6 py-5 shrink-0 border-l border-white/4">
                  <div className="text-center">
                    <p className="text-white font-black text-base leading-none">
                      {stats.tickets_sold.toLocaleString()}
                    </p>
                    <p className="text-white/25 text-[10px] mt-1 flex items-center gap-1 justify-center">
                      <Ticket className="w-2.5 h-2.5" />
                      sold
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-black text-base leading-none">
                      {stats.orders.toLocaleString()}
                    </p>
                    <p className="text-white/25 text-[10px] mt-1">orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-black text-base leading-none">
                      {stats.revenue > 0
                        ? formatPrice(stats.revenue, "KES")
                        : "—"}
                    </p>
                    <p className="text-white/25 text-[10px] mt-1 flex items-center gap-1 justify-center">
                      <TrendingUp className="w-2.5 h-2.5" />
                      revenue
                    </p>
                  </div>
                </div>

                {/* arrow */}
                <div className="px-4 py-5 shrink-0">
                  <ArrowUpRight className="w-4 h-4 text-white/15 group-hover:text-white/40 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
