"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Ticket,
  MapPin,
  CalendarDays,
  ArrowRight,
  ChevronRight,
  Wifi,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import Image from "next/image";

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

interface EventCategoryResponse {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Mock data
const MOCK_CATEGORIES: EventCategoryResponse[] = [
  { id: "1", name: "Music", description: "", created_at: "", updated_at: "" },
  {
    id: "2",
    name: "Conference",
    description: "",
    created_at: "",
    updated_at: "",
  },
  { id: "3", name: "Comedy", description: "", created_at: "", updated_at: "" },
  { id: "4", name: "Sports", description: "", created_at: "", updated_at: "" },
  { id: "5", name: "Arts", description: "", created_at: "", updated_at: "" },
];

const MOCK_PUBLISHED: EventResponse[] = [
  {
    id: "1",
    organiser_id: "o1",
    category_id: "1",
    title: "Afropunk Nairobi 2026",
    slug: "afropunk-nairobi-2026",
    description:
      "The biggest Afropunk festival hits Nairobi with a lineup of world-class artists celebrating African culture and music.",
    location: "Nairobi",
    venue: "Uhuru Gardens",
    banner_url: "",
    starts_at: "2026-06-14T18:00:00Z",
    ends_at: "2026-06-14T23:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    organiser_id: "o2",
    category_id: "2",
    title: "Tech Summit East Africa",
    slug: "tech-summit-east-africa",
    description:
      "East Africa's premier technology conference bringing together innovators, founders, and investors from across the continent.",
    location: "Nairobi",
    venue: "KICC, Nairobi",
    banner_url: "",
    starts_at: "2026-06-25T08:00:00Z",
    ends_at: "2026-06-25T18:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "3",
    organiser_id: "o3",
    category_id: "1",
    title: "Nairobi Jazz Festival",
    slug: "nairobi-jazz-festival",
    description:
      "Three days of world-class jazz performances featuring local legends and international artists at the iconic Village Market.",
    location: "Nairobi",
    venue: "Village Market",
    banner_url: "",
    starts_at: "2026-07-04T17:00:00Z",
    ends_at: "2026-07-06T22:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "4",
    organiser_id: "o4",
    category_id: "3",
    title: "Churchill Show Live",
    slug: "churchill-show-live",
    description:
      "Kenya's most popular comedy show returns live with a star-studded cast of the country's funniest comedians.",
    location: "Nairobi",
    venue: "Carnivore Grounds",
    banner_url: "",
    starts_at: "2026-06-20T19:00:00Z",
    ends_at: "2026-06-20T22:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "5",
    organiser_id: "o5",
    category_id: "2",
    title: "Women in Tech Kenya",
    slug: "women-in-tech-kenya",
    description:
      "A full-day conference celebrating and empowering women in technology across Kenya and East Africa.",
    location: "Nairobi",
    venue: "Radisson Blu Hotel",
    banner_url: "",
    starts_at: "2026-07-10T09:00:00Z",
    ends_at: "2026-07-10T17:00:00Z",
    status: "PUBLISHED",
    is_online: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "6",
    organiser_id: "o6",
    category_id: "5",
    title: "Nairobi Design Week",
    slug: "nairobi-design-week",
    description:
      "A celebration of African design, art and creativity featuring exhibitions, workshops and talks from leading creatives.",
    location: "Nairobi",
    venue: "The Alchemist",
    banner_url: "",
    starts_at: "2026-07-15T10:00:00Z",
    ends_at: "2026-07-20T20:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
];

const MOCK_UPCOMING: EventResponse[] = [
  {
    id: "7",
    organiser_id: "o7",
    category_id: "4",
    title: "Nairobi City Marathon",
    slug: "nairobi-city-marathon",
    description: "",
    location: "Nairobi",
    venue: "Uhuru Highway",
    banner_url: "",
    starts_at: "2026-08-02T06:00:00Z",
    ends_at: "2026-08-02T14:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "8",
    organiser_id: "o8",
    category_id: "1",
    title: "Blankets & Wine",
    slug: "blankets-and-wine",
    description: "",
    location: "Nairobi",
    venue: "Ngong Racecourse",
    banner_url: "",
    starts_at: "2026-08-09T14:00:00Z",
    ends_at: "2026-08-09T21:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "9",
    organiser_id: "o9",
    category_id: "2",
    title: "Africa Fintech Summit",
    slug: "africa-fintech-summit",
    description: "",
    location: "Nairobi",
    venue: "Sarit Expo Centre",
    banner_url: "",
    starts_at: "2026-08-18T08:00:00Z",
    ends_at: "2026-08-19T18:00:00Z",
    status: "PUBLISHED",
    is_online: true,
    created_at: "",
    updated_at: "",
  },
  {
    id: "10",
    organiser_id: "o10",
    category_id: "3",
    title: "Laugh Festival Nairobi",
    slug: "laugh-festival-nairobi",
    description: "",
    location: "Nairobi",
    venue: "Kenya National Theatre",
    banner_url: "",
    starts_at: "2026-09-05T19:00:00Z",
    ends_at: "2026-09-05T22:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "11",
    organiser_id: "o11",
    category_id: "1",
    title: "Coke Studio Africa Live",
    slug: "coke-studio-africa-live",
    description: "",
    location: "Nairobi",
    venue: "Kasarani Stadium",
    banner_url: "",
    starts_at: "2026-09-12T17:00:00Z",
    ends_at: "2026-09-12T23:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "12",
    organiser_id: "o12",
    category_id: "5",
    title: "Nairobi Film Festival",
    slug: "nairobi-film-festival",
    description: "",
    location: "Nairobi",
    venue: "20th Century Fox Cinema",
    banner_url: "",
    starts_at: "2026-09-20T10:00:00Z",
    ends_at: "2026-09-25T22:00:00Z",
    status: "PUBLISHED",
    is_online: false,
    created_at: "",
    updated_at: "",
  },
];

// Helpers
function formatDateShort(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-KE", { weekday: "short" }).toUpperCase(),
    date: d.getDate(),
    month: d.toLocaleDateString("en-KE", { month: "short" }).toUpperCase(),
  };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateFull(iso: string) {
  return new Date(iso)
    .toLocaleDateString("en-KE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toUpperCase();
}

const ACCENTS = [
  "#F97316",
  "#8B5CF6",
  "#0EA5E9",
  "#10B981",
  "#EC4899",
  "#F59E0B",
];
function accentForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}

function categoryName(categoryId: string) {
  return MOCK_CATEGORIES.find((c) => c.id === categoryId)?.name ?? "";
}

// Event card — poster style
function EventCard({ event, index }: { event: EventResponse; index: number }) {
  const accent = accentForId(event.id);
  const { day, date, month } = formatDateShort(event.starts_at);
  const cat = categoryName(event.category_id);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden border border-white/[0.07] bg-[#111009] hover:border-white/[0.15] transition-all duration-500"
      style={{ animationDelay: `${index * 80}ms` }}>
      {/* banner / placeholder */}
      <div className="relative h-52 overflow-hidden">
        {event.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <>
            {/* abstract bg pattern */}
            <div
              className="absolute inset-0"
              style={{ background: "#0e0c0a" }}
            />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `radial-gradient(ellipse at 20% 60%, ${accent} 0%, transparent 65%)`,
              }}
            />
            <div
              className="absolute inset-0 opacity-15"
              style={{
                background: `radial-gradient(ellipse at 80% 20%, ${accent} 0%, transparent 55%)`,
              }}
            />
            {/* large faded title watermark */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <span className="text-[5rem] font-black uppercase tracking-tighter leading-none select-none opacity-[0.04] text-white text-center px-4 line-clamp-2">
                {event.title}
              </span>
            </div>
          </>
        )}
        {/* top gradient fade */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#111009]" />
        {/* accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: accent }}
        />

        {/* date badge — top right */}
        <div className="absolute top-4 right-4 flex flex-col items-center bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 min-w-[52px]">
          <span className="text-white/50 text-[9px] font-bold tracking-widest">
            {day}
          </span>
          <span className="text-white font-black text-2xl leading-none">
            {date}
          </span>
          <span className="text-white/50 text-[9px] font-bold tracking-widest">
            {month}
          </span>
        </div>

        {/* online badge */}
        {event.is_online && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              Online
            </span>
          </div>
        )}
      </div>

      {/* body */}
      <div className="flex flex-col flex-1 px-5 pt-4 pb-5 gap-3">
        <div className="flex items-center gap-2">
          {cat && (
            <span
              className="text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full"
              style={{
                color: accent,
                background: `${accent}15`,
                border: `1px solid ${accent}25`,
              }}>
              {cat}
            </span>
          )}
        </div>

        <h3 className="text-white font-black text-lg leading-tight group-hover:text-orange-50 transition-colors line-clamp-2 tracking-tight">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-white/30 text-xs leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-white/40 text-xs">
              <CalendarDays
                className="w-3 h-3 shrink-0"
                style={{ color: accent }}
              />
              <span>{formatTime(event.starts_at)}</span>
            </div>
            {(event.venue || event.location) && (
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <MapPin
                  className="w-3 h-3 shrink-0"
                  style={{ color: accent }}
                />
                <span className="truncate max-w-[160px]">
                  {event.venue || event.location}
                </span>
              </div>
            )}
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-all duration-300"
            style={{ background: `${accent}15` }}>
            <ArrowUpRight className="w-3.5 h-3.5" style={{ color: accent }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// Upcoming row — setlist style
function UpcomingRow({
  event,
  index,
}: {
  event: EventResponse;
  index: number;
}) {
  const accent = accentForId(event.id);
  const { date, month } = formatDateShort(event.starts_at);
  const cat = categoryName(event.category_id);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/[0.06] bg-[#111009] hover:bg-[#161310] hover:border-white/[0.12] transition-all duration-300">
      {/* index number */}
      <span className="text-white/10 font-black text-sm w-5 text-right shrink-0 group-hover:text-white/20 transition-colors">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* date block */}
      <div
        className="shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center"
        style={{ background: `${accent}12`, border: `1px solid ${accent}20` }}>
        <span
          className="font-black text-base leading-none"
          style={{ color: accent }}>
          {date}
        </span>
        <span
          className="text-[9px] font-bold tracking-widest"
          style={{ color: `${accent}99` }}>
          {month}
        </span>
      </div>

      {/* title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-sm font-bold truncate leading-tight group-hover:text-white transition-colors tracking-tight">
          {event.title}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {cat && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: `${accent}99` }}>
              {cat}
            </span>
          )}
          {(event.venue || event.location) && (
            <span className="text-white/25 text-[10px] flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" />
              <span className="truncate max-w-28">
                {event.venue || event.location}
              </span>
            </span>
          )}
          {event.is_online && (
            <span className="text-emerald-500/70 text-[10px] flex items-center gap-1">
              <Wifi className="w-2.5 h-2.5" />
              Online
            </span>
          )}
        </div>
      </div>

      {/* time + arrow */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-white/25 text-xs font-medium hidden sm:block">
          {formatTime(event.starts_at)}
        </span>
        <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/40 transition-colors" />
      </div>
    </Link>
  );
}

// Category pill
function CategoryPill({
  category,
  active,
  onClick,
}: {
  category: EventCategoryResponse | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
        active
          ? "bg-linear-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20"
          : "bg-white/4 border border-white/8 text-white/50 hover:text-white/80 hover:bg-white/[0.07]"
      }`}>
      {category ? category.name : "All"}
    </button>
  );
}

// Empty state
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
        <Ticket className="w-6 h-6 text-white/15" />
      </div>
      <p className="text-white/20 text-sm">{message}</p>
    </div>
  );
}

// Main page
export default function LandingPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  const published =
    activeCategory === null
      ? MOCK_PUBLISHED
      : MOCK_PUBLISHED.filter((e) => {
          const cat = MOCK_CATEGORIES.find((c) => c.id === e.category_id);
          return cat?.name === activeCategory;
        });

  const upcoming =
    activeCategory === null
      ? MOCK_UPCOMING
      : MOCK_UPCOMING.filter((e) => {
          const cat = MOCK_CATEGORIES.find((c) => c.id === e.category_id);
          return cat?.name === activeCategory;
        });

  return (
    <div className="min-h-screen bg-[#0C0A09] font-sans">
      {/* grain overlay */}
      <div
        className="fixed inset-0 opacity-[0.035] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ambient glow top-left */}
      <div
        className="fixed top-[-30%] left-[-15%] w-[70%] h-[70%] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(251,146,60,0.06) 0%, transparent 70%)",
        }}
      />
      {/* ambient glow bottom-right */}
      <div
        className="fixed bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(139,92,246,0.05) 0%, transparent 70%)",
        }}
      />

      {/* navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0C0A09]/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-black tracking-[0.2em] text-sm uppercase">
              NAFASI
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/events"
              className="text-white/45 hover:text-white text-sm font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-white/[0.04]">
              Events
            </Link>
            <Link
              href="/upcoming"
              className="text-white/45 hover:text-white text-sm font-semibold transition-colors px-3 py-2 rounded-lg hover:bg-white/[0.04]">
              Upcoming
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/4 border border-white/8 text-white/70 hover:text-white text-sm font-semibold transition-all duration-200 hover:bg-white/[0.07]">
                {user?.name?.split(" ")[0]}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-white/45 hover:text-white text-sm font-semibold transition-colors px-3 py-2">
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/25 transition-all duration-200">
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-white/50 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/6 bg-[#0C0A09] px-6 py-4 space-y-1">
            <Link
              href="/events"
              className="block text-white/60 hover:text-white text-sm font-semibold py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors">
              Events
            </Link>
            <Link
              href="/upcoming"
              className="block text-white/60 hover:text-white text-sm font-semibold py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors">
              Upcoming
            </Link>
            <div className="pt-3 border-t border-white/6 flex flex-col gap-2 mt-2">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="text-center px-4 py-2.5 rounded-xl bg-white/4 border border-white/8 text-white text-sm font-semibold">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/signin"
                    className="text-center px-4 py-2.5 rounded-xl border border-white/8 text-white/70 text-sm font-semibold">
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="text-center px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="relative z-10">
        {/* hero */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
          <div className="flex flex-col items-center text-center gap-8">
            {/* live pill */}
            <div className="inline-flex items-center gap-2.5 bg-orange-500/8 border border-orange-500/20 rounded-full px-5 py-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-400" />
              </span>
              <span className="text-orange-400/90 text-xs font-bold uppercase tracking-[0.2em]">
                {MOCK_PUBLISHED.length} events live in Nairobi
              </span>
            </div>

            {/* headline */}
            <div className="space-y-2 max-w-5xl">
              <h1 className="text-white font-black text-6xl sm:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-tight">
                Your next
              </h1>
              <h1 className="font-black text-6xl sm:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-tight text-transparent bg-clip-text bg-linear-to-r from-orange-400 via-amber-400 to-orange-500">
                unforgettable
              </h1>
              <h1 className="text-white font-black text-6xl sm:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-tight">
                experience.
              </h1>
            </div>

            <p className="text-white/35 text-lg max-w-lg leading-relaxed">
              Concerts, conferences, festivals, comedy — all in one place. Book
              tickets in seconds.
            </p>

            {/* stats row */}
            <div className="flex items-center gap-8 py-4 border-y border-white/[0.06] w-full max-w-md justify-center">
              {[
                { value: "2,400+", label: "Events" },
                { value: "50K+", label: "Attendees" },
                { value: "120+", label: "Organisers" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-white font-black text-xl tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-white/30 text-xs uppercase tracking-widest font-semibold">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Link
                href="/events"
                className="px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-xl shadow-orange-500/20 transition-all duration-300 flex items-center gap-2">
                Browse all events
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/upcoming"
                className="px-7 py-3.5 rounded-xl font-bold text-sm text-white/55 hover:text-white bg-white/4 border border-white/8 hover:bg-white/[0.07] transition-all duration-200">
                Upcoming events
              </Link>
            </div>
          </div>
        </section>

        {/* category filter */}
        <section className="max-w-7xl mx-auto px-6 pb-12">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <CategoryPill
              category={null}
              active={activeCategory === null}
              onClick={() => setActiveCategory(null)}
            />
            {MOCK_CATEGORIES.map((cat) => (
              <CategoryPill
                key={cat.id}
                category={cat}
                active={activeCategory === cat.name}
                onClick={() =>
                  setActiveCategory(
                    activeCategory === cat.name ? null : cat.name,
                  )
                }
              />
            ))}
          </div>
        </section>

        {/* published events */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-2">
                Happening now
              </p>
              <h2 className="text-white font-black text-3xl tracking-tight">
                Published Events
              </h2>
            </div>
            <Link
              href="/events"
              className="group flex items-center gap-1.5 text-white/40 hover:text-orange-400 text-sm font-bold transition-colors shrink-0 ml-4">
              See all
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {published.length === 0 ? (
            <EmptyState message="No published events found. Check back soon." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {published.map((event, i) => (
                <EventCard key={event.id} event={event} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* upcoming events — full-width tinted band */}
        <section
          className="border-y border-white/[0.05]"
          style={{ background: "rgba(255,255,255,0.012)" }}>
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-2">
                  Coming up
                </p>
                <h2 className="text-white font-black text-3xl tracking-tight">
                  Upcoming Events
                </h2>
              </div>
              <Link
                href="/upcoming"
                className="group flex items-center gap-1.5 text-white/40 hover:text-orange-400 text-sm font-bold transition-colors shrink-0 ml-4">
                See all
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <EmptyState message="No upcoming events found." />
            ) : (
              <div className="space-y-2">
                {upcoming.map((event, i) => (
                  <UpcomingRow key={event.id} event={event} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA banner */}
        {!isAuthenticated && (
          <section className="max-w-7xl mx-auto px-6 py-20">
            <div className="relative rounded-3xl overflow-hidden border border-white/[0.07] p-12 sm:p-16 text-center">
              {/* background */}
              <div
                className="absolute inset-0"
                style={{ background: "#0f0d0b" }}
              />
              <div
                className="absolute inset-0 opacity-[0.12]"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 0%, rgba(251,146,60,1) 0%, transparent 60%)",
                }}
              />
              {/* top accent line */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-linear-to-r from-transparent via-orange-500 to-transparent" />

              <div className="relative z-10 space-y-5 max-w-xl mx-auto">
                <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase">
                  Join NAFASI
                </p>
                <h2 className="text-white font-black text-4xl sm:text-5xl tracking-tight leading-tight">
                  Ready to experience more?
                </h2>
                <p className="text-white/35 text-base leading-relaxed">
                  Create a free account to book tickets, save events, and never
                  miss out again.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                  <Link
                    href="/sign-up"
                    className="px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-xl shadow-orange-500/20 transition-all duration-300 flex items-center gap-2">
                    Create free account
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/signin"
                    className="px-7 py-3.5 rounded-xl font-bold text-sm text-white/40 hover:text-white transition-colors">
                    Already have an account?
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* footer */}
        <footer className="border-t border-white/[0.05] max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <Ticket className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white/35 text-xs font-black tracking-[0.2em] uppercase">
              NAFASI
            </span>
          </div>
          <p className="text-white/15 text-xs">
            © 2026 NAFASI Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/events"
              className="text-white/20 hover:text-white/50 text-xs font-semibold transition-colors">
              Events
            </Link>
            <Link
              href="/upcoming"
              className="text-white/20 hover:text-white/50 text-xs font-semibold transition-colors">
              Upcoming
            </Link>
            <Link
              href="/sign-up"
              className="text-white/20 hover:text-white/50 text-xs font-semibold transition-colors">
              Sign up
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
