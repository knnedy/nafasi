"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Wifi,
  Clock,
  Ticket,
  ExternalLink,
  Share2,
  CheckCircle,
} from "lucide-react";
import { accentForId, formatTime } from "@/app/(main)/utils";

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

interface AvailableTicketTypesResponse {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  is_free: boolean;
}

// Mock data
const MOCK_EVENT: EventResponse = {
  id: "1",
  organiser_id: "o1",
  category_id: "1",
  title: "Afropunk Nairobi 2026",
  slug: "afropunk-nairobi-2026",
  description:
    "The biggest Afropunk festival hits Nairobi with a lineup of world-class artists celebrating African culture, music, and identity. Expect electrifying performances, immersive art installations, fashion showcases, and a community of people who refuse to be boxed in.\n\nAfropunk Nairobi is more than a concert — it's a movement. Join thousands of fans for a night that celebrates the full spectrum of Black creativity, from afrobeats and punk to neo-soul and spoken word.\n\nDoors open at 5PM. Main stage starts at 7PM.",
  location: "Nairobi, Kenya",
  venue: "Uhuru Gardens",
  banner_url: "",
  starts_at: "2026-06-14T18:00:00Z",
  ends_at: "2026-06-14T23:00:00Z",
  status: "PUBLISHED",
  is_online: false,
  created_at: "",
  updated_at: "",
};

const MOCK_TICKETS: AvailableTicketTypesResponse[] = [
  {
    id: "t1",
    event_id: "1",
    name: "General Admission",
    description: "Standing access to all stages and general areas.",
    price: 250000,
    currency: "KES",
    is_free: false,
  },
  {
    id: "t2",
    event_id: "1",
    name: "VIP",
    description:
      "Priority entry, dedicated viewing area, and complimentary drinks.",
    price: 750000,
    currency: "KES",
    is_free: false,
  },
  {
    id: "t3",
    event_id: "1",
    name: "Early Bird",
    description:
      "Limited early bird tickets at a discounted price. First come, first served.",
    price: 150000,
    currency: "KES",
    is_free: false,
  },
];

// Helpers
function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDuration(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Ticket card
function TicketCard({
  ticket,
  accent,
  selected,
  onSelect,
}: {
  ticket: AvailableTicketTypesResponse;
  accent: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border p-5 transition-all duration-200 ${
        selected
          ? "border-orange-500/50 bg-orange-500/8"
          : "border-white/8 bg-white/2 hover:bg-white/4 hover:border-white/12"
      }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white font-bold text-sm">{ticket.name}</p>
            {selected && (
              <CheckCircle className="w-4 h-4 text-orange-400 shrink-0" />
            )}
          </div>
          {ticket.description && (
            <p className="text-white/35 text-xs leading-relaxed">
              {ticket.description}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          {ticket.is_free ? (
            <span className="text-emerald-400 font-black text-sm">Free</span>
          ) : (
            <span className="text-white font-black text-sm">
              {formatPrice(ticket.price, ticket.currency)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// Main page
export default function EventPage() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const event = MOCK_EVENT;
  const tickets = MOCK_TICKETS;
  const accent = accentForId(event.id);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedTicketData = tickets.find((t) => t.id === selectedTicket);

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
      {/* back link */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-white/30 hover:text-white/70 text-sm font-semibold transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* left — event details */}
        <div className="lg:col-span-2 space-y-8">
          {/* banner */}
          <div className="relative rounded-2xl overflow-hidden h-72 sm:h-96">
            {event.banner_url ? (
              <Image
                src={event.banner_url}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <>
                <div
                  className="absolute inset-0"
                  style={{ background: "#0e0c0a" }}
                />
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    background: `radial-gradient(ellipse at 25% 60%, ${accent} 0%, transparent 65%)`,
                  }}
                />
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(ellipse at 80% 20%, ${accent} 0%, transparent 55%)`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <span className="text-[8rem] font-black uppercase tracking-tighter leading-none select-none opacity-[0.03] text-white text-center px-8">
                    {event.title}
                  </span>
                </div>
              </>
            )}
            {/* top accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-0.75"
              style={{ background: accent }}
            />

            {/* status badge */}
            <div className="absolute top-4 left-4">
              <span
                className="text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full"
                style={{
                  color: accent,
                  background: `${accent}18`,
                  border: `1px solid ${accent}30`,
                }}>
                {event.status}
              </span>
            </div>

            {/* share button */}
            <button
              onClick={handleShare}
              className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-white/70 hover:text-white text-xs font-semibold transition-colors">
              {copied ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </>
              )}
            </button>
          </div>

          {/* title + meta */}
          <div className="space-y-4">
            <h1 className="text-white font-black text-3xl sm:text-4xl tracking-tight leading-tight">
              {event.title}
            </h1>

            {/* meta row */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <CalendarDays
                  className="w-4 h-4 shrink-0"
                  style={{ color: accent }}
                />
                <span>{formatDateLong(event.starts_at)}</span>
              </div>
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <Clock className="w-4 h-4 shrink-0" style={{ color: accent }} />
                <span>
                  {formatTime(event.starts_at)} – {formatTime(event.ends_at)}{" "}
                  <span className="text-white/25">
                    ({formatDuration(event.starts_at, event.ends_at)})
                  </span>
                </span>
              </div>
              {event.is_online ? (
                <div className="flex items-center gap-3 text-emerald-500/80 text-sm">
                  <Wifi className="w-4 h-4 shrink-0" />
                  <span>Online event</span>
                  {event.online_url && (
                    <a
                      href={event.online_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
                      Join link
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : (
                (event.venue || event.location) && (
                  <div className="flex items-center gap-3 text-white/50 text-sm">
                    <MapPin
                      className="w-4 h-4 shrink-0"
                      style={{ color: accent }}
                    />
                    <span>
                      {event.venue}
                      {event.venue && event.location && (
                        <span className="text-white/25">
                          {" "}
                          · {event.location}
                        </span>
                      )}
                      {!event.venue && event.location}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* divider */}
          <div className="h-px bg-white/6" />

          {/* description */}
          {event.description && (
            <div className="space-y-3">
              <h2 className="text-white font-black text-lg tracking-tight">
                About this event
              </h2>
              <div className="space-y-4">
                {event.description.split("\n\n").map((para, i) => (
                  <p key={i} className="text-white/50 text-sm leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* right — ticket sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* ticket section header */}
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="w-4 h-4" style={{ color: accent }} />
              <h2 className="text-white font-black text-lg tracking-tight">
                Tickets
              </h2>
            </div>

            {/* ticket options */}
            {tickets.length === 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white/2 p-6 text-center">
                <p className="text-white/25 text-sm">No tickets available.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    accent={accent}
                    selected={selectedTicket === ticket.id}
                    onSelect={() =>
                      setSelectedTicket(
                        selectedTicket === ticket.id ? null : ticket.id,
                      )
                    }
                  />
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="pt-2">
              {selectedTicketData ? (
                <button className="w-full h-12 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/25 transition-all duration-200 flex items-center justify-center gap-2">
                  <Ticket className="w-4 h-4" />
                  {selectedTicketData.is_free
                    ? "Reserve free ticket"
                    : `Buy for ${formatPrice(selectedTicketData.price, selectedTicketData.currency)}`}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full h-12 rounded-xl font-bold text-sm text-white/20 bg-white/4 border border-white/8 cursor-not-allowed flex items-center justify-center gap-2">
                  <Ticket className="w-4 h-4" />
                  Select a ticket type
                </button>
              )}
            </div>

            {/* pricing note */}
            <p className="text-white/20 text-xs text-center">
              Secure checkout · Instant confirmation
            </p>

            {/* divider */}
            <div className="h-px bg-white/6" />

            {/* event at a glance */}
            <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-4">
              <h3 className="text-white/60 text-xs font-black uppercase tracking-widest">
                Event details
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarDays className="w-3.5 h-3.5 text-white/25 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/70 text-xs font-semibold">Date</p>
                    <p className="text-white/35 text-xs mt-0.5">
                      {formatDateLong(event.starts_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-3.5 h-3.5 text-white/25 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/70 text-xs font-semibold">Time</p>
                    <p className="text-white/35 text-xs mt-0.5">
                      {formatTime(event.starts_at)} –{" "}
                      {formatTime(event.ends_at)}
                    </p>
                  </div>
                </div>
                {!event.is_online && (event.venue || event.location) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-3.5 h-3.5 text-white/25 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/70 text-xs font-semibold">
                        Location
                      </p>
                      <p className="text-white/35 text-xs mt-0.5">
                        {event.venue && (
                          <span className="block">{event.venue}</span>
                        )}
                        {event.location && (
                          <span className="block">{event.location}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {event.is_online && (
                  <div className="flex items-start gap-3">
                    <Wifi className="w-3.5 h-3.5 text-white/25 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/70 text-xs font-semibold">
                        Format
                      </p>
                      <p className="text-white/35 text-xs mt-0.5">
                        Online event
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
