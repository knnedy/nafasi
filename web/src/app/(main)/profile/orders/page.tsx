"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Ticket,
  CalendarDays,
  MapPin,
  Wifi,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  QrCode,
} from "lucide-react";
import { accentForId, formatPrice } from "@/app/(main)/utils";
import Image from "next/image";

// Types
interface UserOrderResponse {
  id: string;
  quantity: number;
  status: string;
  qr_code: string;
  checked_in: boolean;
  checked_in_at?: string;
  created_at: string;
  event_title: string;
  event_slug: string;
  event_starts_at: string;
  event_ends_at: string;
  event_location?: string;
  event_venue?: string;
  event_is_online: boolean;
  event_online_url?: string;
  event_banner_url?: string;
  ticket_type_name: string;
  ticket_type_price: number;
}

// Mock data
const MOCK_ORDERS: UserOrderResponse[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    quantity: 2,
    status: "CONFIRMED",
    qr_code: "NAFASI-TK-A1B2C3D4",
    checked_in: false,
    created_at: "2026-05-10T14:32:00Z",
    event_title: "Afropunk Nairobi 2026",
    event_slug: "afropunk-nairobi-2026",
    event_starts_at: "2026-06-14T18:00:00Z",
    event_ends_at: "2026-06-14T23:00:00Z",
    event_location: "Nairobi, Kenya",
    event_venue: "Uhuru Gardens",
    event_is_online: false,
    event_banner_url: "",
    ticket_type_name: "VIP",
    ticket_type_price: 750000,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    quantity: 1,
    status: "CONFIRMED",
    qr_code: "NAFASI-TK-E5F6G7H8",
    checked_in: true,
    checked_in_at: "2026-04-20T19:15:00Z",
    created_at: "2026-04-01T09:00:00Z",
    event_title: "Nairobi Jazz Festival",
    event_slug: "nairobi-jazz-festival",
    event_starts_at: "2026-07-04T17:00:00Z",
    event_ends_at: "2026-07-06T22:00:00Z",
    event_location: "Nairobi, Kenya",
    event_venue: "Village Market",
    event_is_online: false,
    event_banner_url: "",
    ticket_type_name: "General Admission",
    ticket_type_price: 250000,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    quantity: 1,
    status: "PENDING",
    qr_code: "",
    checked_in: false,
    created_at: "2026-05-20T11:00:00Z",
    event_title: "Tech Summit East Africa",
    event_slug: "tech-summit-east-africa",
    event_starts_at: "2026-06-25T08:00:00Z",
    event_ends_at: "2026-06-25T18:00:00Z",
    event_location: "Nairobi, Kenya",
    event_venue: "KICC, Nairobi",
    event_is_online: false,
    event_banner_url: "",
    ticket_type_name: "Early Bird",
    ticket_type_price: 150000,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    quantity: 1,
    status: "CONFIRMED",
    qr_code: "NAFASI-TK-I9J0K1L2",
    checked_in: false,
    created_at: "2026-05-18T16:00:00Z",
    event_title: "Women in Tech Kenya",
    event_slug: "women-in-tech-kenya",
    event_starts_at: "2026-07-10T09:00:00Z",
    event_ends_at: "2026-07-10T17:00:00Z",
    event_is_online: true,
    event_online_url: "https://meet.example.com/women-in-tech",
    event_banner_url: "",
    ticket_type_name: "General Admission",
    ticket_type_price: 0,
  },
];

// Helpers
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    weekday: "short",
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

// Status badge
function StatusBadge({
  status,
  checkedIn,
}: {
  status: string;
  checkedIn: boolean;
}) {
  if (checkedIn) {
    return (
      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5 shrink-0">
        <CheckCircle className="w-3 h-3" />
        Checked in
      </span>
    );
  }

  const styles: Record<string, string> = {
    CONFIRMED: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    PENDING: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    CANCELLED: "bg-red-500/10 border-red-500/20 text-red-400",
    REFUNDED: "bg-white/8 border-white/12 text-white/40",
  };

  return (
    <span
      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${
        styles[status] ?? "bg-white/8 border-white/12 text-white/40"
      }`}>
      {status.toLowerCase()}
    </span>
  );
}

// Expanded order detail
function OrderDetail({ order }: { order: UserOrderResponse }) {
  const accent = accentForId(order.id);
  const total = order.ticket_type_price * order.quantity;

  return (
    <div className="mt-4 pt-4 border-t border-white/6 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">
            Date
          </p>
          <p className="text-white/70 text-xs font-semibold">
            {formatDate(order.event_starts_at)}
          </p>
        </div>
        <div>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">
            Time
          </p>
          <p className="text-white/70 text-xs font-semibold">
            {formatTime(order.event_starts_at)} –{" "}
            {formatTime(order.event_ends_at)}
          </p>
        </div>
        <div>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">
            Quantity
          </p>
          <p className="text-white/70 text-xs font-semibold">
            {order.quantity} ticket{order.quantity > 1 ? "s" : ""}
          </p>
        </div>
        <div>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">
            Total paid
          </p>
          <p className="text-white/70 text-xs font-semibold">
            {order.ticket_type_price === 0 ? "Free" : formatPrice(total, "KES")}
          </p>
        </div>
      </div>

      {/* location */}
      <div className="flex items-center gap-2 text-white/40 text-xs">
        {order.event_is_online ? (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-400/80">Online event</span>
            {order.event_online_url && (
              <a
                href={order.event_online_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 ml-1 transition-colors">
                Join link
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </>
        ) : (
          <>
            <MapPin
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: accent }}
            />
            <span>
              {order.event_venue}
              {order.event_venue && order.event_location && (
                <span className="text-white/25"> · {order.event_location}</span>
              )}
              {!order.event_venue && order.event_location}
            </span>
          </>
        )}
      </div>

      {/* QR code */}
      {order.qr_code && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: `${accent}15`,
              border: `1px solid ${accent}25`,
            }}>
            <QrCode className="w-4 h-4" style={{ color: accent }} />
          </div>
          <div className="min-w-0">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
              Entry code
            </p>
            <p className="text-white/70 text-xs font-mono font-bold mt-0.5 truncate">
              {order.qr_code}
            </p>
          </div>
        </div>
      )}

      {/* checked in at */}
      {order.checked_in && order.checked_in_at && (
        <div className="flex items-center gap-2 text-emerald-400/70 text-xs">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>
            Checked in on {formatDate(order.checked_in_at)} at{" "}
            {formatTime(order.checked_in_at)}
          </span>
        </div>
      )}

      {/* view event link */}
      <Link
        href={`/events/${order.event_slug}`}
        className="inline-flex items-center gap-1.5 text-orange-400 hover:text-orange-300 text-xs font-bold transition-colors">
        View event
        <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}

// Order card
function OrderCard({ order }: { order: UserOrderResponse }) {
  const [expanded, setExpanded] = useState(false);
  const accent = accentForId(order.id);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden transition-all duration-200 hover:border-white/12">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left">
        {/* accent dot */}
        <div
          className="w-1 self-stretch rounded-full shrink-0"
          style={{ background: accent }}
        />

        {/* event banner thumbnail */}
        <div
          className="w-12 h-12 rounded-xl shrink-0 overflow-hidden"
          style={{
            background: `${accent}15`,
            border: `1px solid ${accent}20`,
          }}>
          {order.event_banner_url ? (
            <Image
              src={order.event_banner_url}
              alt={order.event_title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Ticket className="w-5 h-5" style={{ color: `${accent}80` }} />
            </div>
          )}
        </div>

        {/* main info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate leading-tight">
            {order.event_title}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-white/40 text-xs">
              {order.ticket_type_name}
            </span>
            <span className="text-white/25 text-xs flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {formatDate(order.event_starts_at)}
            </span>
          </div>
        </div>

        {/* right side */}
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={order.status} checkedIn={order.checked_in} />
          <div className="text-white/20 hover:text-white/50 transition-colors">
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          <OrderDetail order={order} />
        </div>
      )}
    </div>
  );
}

// Filter tabs
const FILTERS = ["All", "Confirmed", "Pending", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];

// Orders page
export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const filtered = MOCK_ORDERS.filter((o) => {
    if (activeFilter === "All") return true;
    return o.status === activeFilter.toUpperCase();
  });

  return (
    <div className="space-y-6">
      {/* page header */}
      <div>
        <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
          Account
        </p>
        <h1 className="text-white font-black text-3xl tracking-tight">
          Orders
        </h1>
        <p className="text-white/30 text-sm mt-1">
          Your ticket purchases and reservations.
        </p>
      </div>

      {/* filter tabs */}
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
          {filtered.length} {filtered.length === 1 ? "order" : "orders"}
        </span>
      </div>

      {/* orders list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
            <Ticket className="w-6 h-6 text-white/15" />
          </div>
          <p className="text-white/20 text-sm">No orders found.</p>
          <Link
            href="/events"
            className="text-orange-400 hover:text-orange-300 text-xs font-bold mt-3 transition-colors">
            Browse events →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
