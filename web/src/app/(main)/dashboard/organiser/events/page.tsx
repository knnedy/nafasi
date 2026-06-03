"use client";

import { useState } from "react";
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
} from "lucide-react";
import { accentForId, formatPrice } from "@/app/(main)/utils";

// Types
interface EventResponse {
  id: string;
  organiser_id: string;
  category_id: string;
  title: string;
  slug: string;
  description?: string;
  location?: string;
  venue?: string;
  banner_url?: string;
  starts_at: string;
  ends_at: string;
  status: string;
  is_online: boolean;
  online_url?: string;
  created_at: string;
  updated_at: string;
}

// Mock data
const MOCK_EVENTS: EventResponse[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    organiser_id: "o1",
    category_id: "1",
    title: "Afropunk Nairobi 2026",
    slug: "afropunk-nairobi-2026",
    description:
      "The biggest Afropunk festival hits Nairobi with a lineup of world-class artists celebrating African culture, music, and identity.",
    location: "Nairobi, Kenya",
    venue: "Uhuru Gardens",
    banner_url: "",
    starts_at: "2026-06-14T18:00:00Z",
    ends_at: "2026-06-14T23:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "2026-04-01T10:00:00Z",
    updated_at: "2026-04-01T10:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    organiser_id: "o1",
    category_id: "2",
    title: "Tech Summit East Africa",
    slug: "tech-summit-east-africa",
    description:
      "East Africa's premier technology conference bringing together innovators, founders, and investors.",
    location: "Nairobi, Kenya",
    venue: "KICC, Nairobi",
    banner_url: "",
    starts_at: "2026-06-25T08:00:00Z",
    ends_at: "2026-06-25T18:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-15T10:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    organiser_id: "o1",
    category_id: "2",
    title: "Women in Tech Kenya",
    slug: "women-in-tech-kenya",
    description:
      "A full-day conference celebrating and empowering women in technology across Kenya and East Africa.",
    location: "Nairobi, Kenya",
    venue: "Radisson Blu Hotel",
    banner_url: "",
    starts_at: "2026-07-10T09:00:00Z",
    ends_at: "2026-07-10T17:00:00Z",
    status: "DRAFT",
    is_online: true,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    organiser_id: "o1",
    category_id: "1",
    title: "Nairobi Jazz Festival",
    slug: "nairobi-jazz-festival",
    description:
      "Three days of world-class jazz performances featuring local legends and international artists.",
    location: "Nairobi, Kenya",
    venue: "Village Market",
    banner_url: "",
    starts_at: "2026-07-04T17:00:00Z",
    ends_at: "2026-07-06T22:00:00Z",
    status: "DRAFT",
    is_online: false,
    created_at: "2026-05-10T10:00:00Z",
    updated_at: "2026-05-10T10:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    organiser_id: "o1",
    category_id: "3",
    title: "Churchill Show Live",
    slug: "churchill-show-live",
    description: "Kenya's most popular comedy show returns live.",
    location: "Nairobi, Kenya",
    venue: "Carnivore Grounds",
    banner_url: "",
    starts_at: "2026-05-01T19:00:00Z",
    ends_at: "2026-05-01T22:00:00Z",
    status: "COMPLETED",
    is_online: false,
    created_at: "2026-02-01T10:00:00Z",
    updated_at: "2026-05-02T10:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440006",
    organiser_id: "o1",
    category_id: "2",
    title: "Startup Grind Nairobi",
    slug: "startup-grind-nairobi",
    description:
      "Monthly meetup for entrepreneurs and startup founders in Nairobi.",
    location: "Nairobi, Kenya",
    venue: "iHub Nairobi",
    banner_url: "",
    starts_at: "2026-04-15T18:00:00Z",
    ends_at: "2026-04-15T21:00:00Z",
    status: "CANCELLED",
    is_online: false,
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-04-10T10:00:00Z",
  },
];

// Mock per-event stats
const MOCK_EVENT_STATS: Record<
  string,
  { tickets_sold: number; revenue: number; orders: number }
> = {
  "550e8400-e29b-41d4-a716-446655440001": {
    tickets_sold: 312,
    revenue: 8400000,
    orders: 198,
  },
  "550e8400-e29b-41d4-a716-446655440002": {
    tickets_sold: 87,
    revenue: 1305000,
    orders: 64,
  },
  "550e8400-e29b-41d4-a716-446655440003": {
    tickets_sold: 0,
    revenue: 0,
    orders: 0,
  },
  "550e8400-e29b-41d4-a716-446655440004": {
    tickets_sold: 0,
    revenue: 0,
    orders: 0,
  },
  "550e8400-e29b-41d4-a716-446655440005": {
    tickets_sold: 203,
    revenue: 3045000,
    orders: 156,
  },
  "550e8400-e29b-41d4-a716-446655440006": {
    tickets_sold: 12,
    revenue: 180000,
    orders: 10,
  },
};

// Helpers
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Status config
function statusConfig(status: string) {
  switch (status) {
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
        label: status,
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

  const filtered = MOCK_EVENTS.filter((e) => {
    const matchesFilter =
      activeFilter === "All" || e.status === activeFilter.toUpperCase();
    const matchesSearch =
      search.trim() === "" ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
            {MOCK_EVENTS.length} total ·{" "}
            {MOCK_EVENTS.filter((e) => e.status === "PUBLISHED").length}{" "}
            published
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
      {filtered.length === 0 ? (
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
            const stats = MOCK_EVENT_STATS[event.id];
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
