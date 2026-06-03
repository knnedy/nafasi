"use client";

import Link from "next/link";
import {
  CalendarDays,
  TrendingUp,
  Ticket,
  ShoppingBag,
  ArrowUpRight,
  MapPin,
  Wifi,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Circle,
} from "lucide-react";
import { accentForId, formatPrice, formatTime } from "@/app/(main)/utils";

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

interface OrganiserOrderResponse {
  id: string;
  user_id: string;
  event_id: string;
  ticket_type_id: string;
  quantity: number;
  status: string;
  payment_method?: string;
  payment_ref?: string;
  checked_in: boolean;
  checked_in_at?: string;
  created_at: string;
}

// Mock data
const MOCK_EVENTS: EventResponse[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    organiser_id: "o1",
    category_id: "1",
    title: "Afropunk Nairobi 2026",
    slug: "afropunk-nairobi-2026",
    description: "The biggest Afropunk festival hits Nairobi.",
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
    description: "East Africa's premier technology conference.",
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
    description: "A full-day conference celebrating women in technology.",
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
];

const MOCK_RECENT_ORDERS: (OrganiserOrderResponse & {
  event_title: string;
  ticket_type_name: string;
})[] = [
  {
    id: "ord-001",
    user_id: "u1",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    ticket_type_id: "tt1",
    quantity: 2,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "QH7K2L9M",
    checked_in: false,
    created_at: "2026-05-28T14:32:00Z",
    event_title: "Afropunk Nairobi 2026",
    ticket_type_name: "VIP",
  },
  {
    id: "ord-002",
    user_id: "u2",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    ticket_type_id: "tt2",
    quantity: 1,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "RT4P8N3X",
    checked_in: false,
    created_at: "2026-05-27T09:15:00Z",
    event_title: "Afropunk Nairobi 2026",
    ticket_type_name: "General Admission",
  },
  {
    id: "ord-003",
    user_id: "u3",
    event_id: "550e8400-e29b-41d4-a716-446655440002",
    ticket_type_id: "tt3",
    quantity: 3,
    status: "PENDING",
    payment_method: "MPESA",
    checked_in: false,
    created_at: "2026-05-26T16:45:00Z",
    event_title: "Tech Summit East Africa",
    ticket_type_name: "Early Bird",
  },
  {
    id: "ord-004",
    user_id: "u4",
    event_id: "550e8400-e29b-41d4-a716-446655440002",
    ticket_type_id: "tt3",
    quantity: 1,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "WQ2J5K8Y",
    checked_in: false,
    created_at: "2026-05-25T11:20:00Z",
    event_title: "Tech Summit East Africa",
    ticket_type_name: "Early Bird",
  },
  {
    id: "ord-005",
    user_id: "u5",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    ticket_type_id: "tt2",
    quantity: 2,
    status: "CANCELLED",
    payment_method: "MPESA",
    checked_in: false,
    created_at: "2026-05-24T08:00:00Z",
    event_title: "Afropunk Nairobi 2026",
    ticket_type_name: "General Admission",
  },
];

// Mock per-event stats
const MOCK_EVENT_STATS: Record<
  string,
  { tickets_sold: number; revenue: number; orders: number; checked_in: number }
> = {
  "550e8400-e29b-41d4-a716-446655440001": {
    tickets_sold: 312,
    revenue: 8400000,
    orders: 198,
    checked_in: 0,
  },
  "550e8400-e29b-41d4-a716-446655440002": {
    tickets_sold: 87,
    revenue: 1305000,
    orders: 64,
    checked_in: 0,
  },
  "550e8400-e29b-41d4-a716-446655440003": {
    tickets_sold: 0,
    revenue: 0,
    orders: 0,
    checked_in: 0,
  },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
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

function orderStatusConfig(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    case "PENDING":
      return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    case "CANCELLED":
      return "bg-red-500/10 border-red-500/20 text-red-400";
    default:
      return "bg-white/6 border-white/10 text-white/40";
  }
}

// Stat card
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-white/35 text-xs font-bold uppercase tracking-widest">
          {label}
        </p>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: `${accent}15`,
            border: `1px solid ${accent}20`,
          }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
      </div>
      <div>
        <p className="text-white font-black text-2xl tracking-tight">{value}</p>
        {sub && <p className="text-white/25 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// Overview page
export default function OrganiserOverviewPage() {
  // aggregate stats across all events
  const totalTicketsSold = Object.values(MOCK_EVENT_STATS).reduce(
    (s, e) => s + e.tickets_sold,
    0,
  );
  const totalRevenue = Object.values(MOCK_EVENT_STATS).reduce(
    (s, e) => s + e.revenue,
    0,
  );
  const totalOrders = Object.values(MOCK_EVENT_STATS).reduce(
    (s, e) => s + e.orders,
    0,
  );
  const totalEvents = MOCK_EVENTS.length;
  const publishedEvents = MOCK_EVENTS.filter(
    (e) => e.status === "PUBLISHED",
  ).length;

  return (
    <div className="space-y-8">
      {/* page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
            Dashboard
          </p>
          <h1 className="text-white font-black text-3xl tracking-tight">
            Overview
          </h1>
          <p className="text-white/30 text-sm mt-1">
            Your events and sales at a glance.
          </p>
        </div>
        <Link
          href="/dashboard/organiser/events/new"
          className="shrink-0 h-10 px-4 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          New event
        </Link>
      </div>

      {/* stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total events"
          value={String(totalEvents)}
          icon={CalendarDays}
          accent="#f97316"
          sub={`${publishedEvents} published`}
        />
        <StatCard
          label="Tickets sold"
          value={totalTicketsSold.toLocaleString()}
          icon={Ticket}
          accent="#8b5cf6"
        />
        <StatCard
          label="Total orders"
          value={totalOrders.toLocaleString()}
          icon={ShoppingBag}
          accent="#0ea5e9"
        />
        <StatCard
          label="Revenue"
          value={formatPrice(totalRevenue, "KES")}
          icon={TrendingUp}
          accent="#10b981"
          sub="All time"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* events list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-black text-base tracking-tight">
              Your Events
            </h2>
            <Link
              href="/dashboard/organiser/events"
              className="group flex items-center gap-1 text-white/35 hover:text-orange-400 text-xs font-bold transition-colors">
              View all
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {MOCK_EVENTS.map((event) => {
              const accent = accentForId(event.id);
              const stats = MOCK_EVENT_STATS[event.id];
              const sc = statusConfig(event.status);
              const StatusIcon = sc.icon;

              return (
                <Link
                  key={event.id}
                  href={`/dashboard/organiser/events/${event.id}`}
                  className="group flex items-center gap-4 p-4 rounded-2xl border border-white/6 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all duration-200">
                  {/* accent stripe */}
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ background: accent }}
                  />

                  {/* date block */}
                  <div
                    className="shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center text-center"
                    style={{
                      background: `${accent}12`,
                      border: `1px solid ${accent}20`,
                    }}>
                    <span
                      className="font-black text-sm leading-none"
                      style={{ color: accent }}>
                      {new Date(event.starts_at).getDate()}
                    </span>
                    <span
                      className="text-[9px] font-bold tracking-widest mt-0.5"
                      style={{ color: `${accent}80` }}>
                      {new Date(event.starts_at)
                        .toLocaleDateString("en-KE", { month: "short" })
                        .toUpperCase()}
                    </span>
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate group-hover:text-orange-50 transition-colors">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${sc.bg} ${sc.color}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {sc.label}
                      </span>
                      {event.is_online ? (
                        <span className="text-white/25 text-[10px] flex items-center gap-1">
                          <Wifi className="w-3 h-3" />
                          Online
                        </span>
                      ) : (
                        (event.venue || event.location) && (
                          <span className="text-white/25 text-[10px] flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-24">
                              {event.venue || event.location}
                            </span>
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* per-event stats */}
                  <div className="shrink-0 text-right hidden sm:block">
                    <p className="text-white font-black text-sm">
                      {stats.tickets_sold.toLocaleString()}
                    </p>
                    <p className="text-white/25 text-[10px] mt-0.5">
                      tickets sold
                    </p>
                  </div>

                  <ArrowUpRight className="w-4 h-4 text-white/15 group-hover:text-white/40 shrink-0 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* recent orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-black text-base tracking-tight">
              Recent Orders
            </h2>
            <Link
              href="/dashboard/organiser/orders"
              className="group flex items-center gap-1 text-white/35 hover:text-orange-400 text-xs font-bold transition-colors">
              View all
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          <div className="rounded-2xl border border-white/6 bg-white/2 overflow-hidden">
            {MOCK_RECENT_ORDERS.map((order, i) => (
              <div
                key={order.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  i < MOCK_RECENT_ORDERS.length - 1
                    ? "border-b border-white/4"
                    : ""
                }`}>
                {/* ticket icon */}
                <div className="w-8 h-8 rounded-lg bg-white/4 border border-white/6 flex items-center justify-center shrink-0">
                  <Ticket className="w-3.5 h-3.5 text-white/25" />
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-bold truncate leading-tight">
                    {order.ticket_type_name}
                  </p>
                  <p className="text-white/25 text-[10px] truncate mt-0.5">
                    {order.event_title}
                  </p>
                </div>

                {/* right */}
                <div className="shrink-0 text-right space-y-1">
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border block ${orderStatusConfig(order.status)}`}>
                    {order.status.toLowerCase()}
                  </span>
                  <p className="text-white/20 text-[10px] flex items-center gap-1 justify-end">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(order.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
