"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Wifi,
  Ticket,
  TrendingUp,
  ShoppingBag,
  CheckCircle,
  Users,
  Edit,
  ArrowUpRight,
  Circle,
  XCircle,
  ExternalLink,
  Clock,
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

interface TicketTypeResponse {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  quantity_sold: number;
  is_free: boolean;
  sale_starts?: string;
  sale_ends?: string;
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

interface OrderStatusBreakdownResponse {
  status: string;
  count: number;
}

// Mock data
const MOCK_EVENT: EventResponse = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  organiser_id: "o1",
  category_id: "1",
  title: "Afropunk Nairobi 2026",
  slug: "afropunk-nairobi-2026",
  description:
    "The biggest Afropunk festival hits Nairobi with a lineup of world-class artists celebrating African culture, music, and identity. Expect electrifying performances, immersive art installations, fashion showcases, and a community of people who refuse to be boxed in.",
  location: "Nairobi, Kenya",
  venue: "Uhuru Gardens",
  banner_url: "",
  starts_at: "2026-06-14T18:00:00Z",
  ends_at: "2026-06-14T23:00:00Z",
  status: "PUBLISHED",
  is_online: false,
  created_at: "2026-04-01T10:00:00Z",
  updated_at: "2026-04-01T10:00:00Z",
};

const MOCK_TICKET_TYPES: TicketTypeResponse[] = [
  {
    id: "tt1",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    name: "General Admission",
    description: "Standing access to all stages and general areas.",
    price: 250000,
    currency: "KES",
    quantity: 500,
    quantity_sold: 312,
    is_free: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "tt2",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    name: "VIP",
    description:
      "Priority entry, dedicated viewing area, and complimentary drinks.",
    price: 750000,
    currency: "KES",
    quantity: 100,
    quantity_sold: 78,
    is_free: false,
    created_at: "",
    updated_at: "",
  },
  {
    id: "tt3",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Early Bird",
    description: "Limited early bird tickets at a discounted price.",
    price: 150000,
    currency: "KES",
    quantity: 200,
    quantity_sold: 200,
    is_free: false,
    sale_ends: "2026-05-01T00:00:00Z",
    created_at: "",
    updated_at: "",
  },
];

const MOCK_STATS = {
  total_tickets_sold: 590,
  revenue: 18950000,
  checked_in_count: 0,
  total_orders: 312,
};

const MOCK_BREAKDOWN: OrderStatusBreakdownResponse[] = [
  { status: "CONFIRMED", count: 289 },
  { status: "PENDING", count: 18 },
  { status: "CANCELLED", count: 5 },
];

const MOCK_RECENT_ORDERS: OrganiserOrderResponse[] = [
  {
    id: "ord-001",
    user_id: "u1",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    ticket_type_id: "tt2",
    quantity: 2,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "QH7K2L9M",
    checked_in: false,
    created_at: "2026-05-28T14:32:00Z",
  },
  {
    id: "ord-002",
    user_id: "u2",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    ticket_type_id: "tt1",
    quantity: 1,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "RT4P8N3X",
    checked_in: false,
    created_at: "2026-05-27T09:15:00Z",
  },
  {
    id: "ord-003",
    user_id: "u3",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    ticket_type_id: "tt1",
    quantity: 3,
    status: "PENDING",
    payment_method: "MPESA",
    checked_in: false,
    created_at: "2026-05-26T16:45:00Z",
  },
  {
    id: "ord-004",
    user_id: "u4",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    ticket_type_id: "tt3",
    quantity: 1,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "WQ2J5K8Y",
    checked_in: false,
    created_at: "2026-05-25T11:20:00Z",
  },
  {
    id: "ord-005",
    user_id: "u5",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    ticket_type_id: "tt1",
    quantity: 2,
    status: "CANCELLED",
    payment_method: "MPESA",
    checked_in: false,
    created_at: "2026-05-24T08:00:00Z",
  },
];

// Helpers
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

function ticketTypeName(id: string) {
  return MOCK_TICKET_TYPES.find((t) => t.id === id)?.name ?? "Unknown";
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
        icon: Circle,
      };
  }
}

function orderStatusClass(status: string) {
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
    <div className="rounded-2xl border border-white/8 bg-white/2 p-5">
      <div className="flex items-center justify-between mb-3">
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
      <p className="text-white font-black text-2xl tracking-tight">{value}</p>
      {sub && <p className="text-white/25 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

// Event detail page
export default function OrganiserEventDetailPage() {
  const event = MOCK_EVENT;
  const accent = accentForId(event.id);
  const sc = statusConfig(event.status);
  const StatusIcon = sc.icon;

  const totalCapacity = MOCK_TICKET_TYPES.reduce((s, t) => s + t.quantity, 0);
  const soldPct =
    totalCapacity > 0
      ? Math.round((MOCK_STATS.total_tickets_sold / totalCapacity) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* back + header */}
      <div>
        <Link
          href="/dashboard/organiser/events"
          className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-sm font-semibold transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          All events
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${sc.bg} ${sc.color}`}>
                <StatusIcon className="w-2.5 h-2.5" />
                {sc.label}
              </span>
              <Link
                href={`/events/${event.slug}`}
                target="_blank"
                className="text-white/25 hover:text-white/50 text-[10px] font-bold flex items-center gap-1 transition-colors">
                View public page
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <h1 className="text-white font-black text-3xl tracking-tight leading-tight truncate">
              {event.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="text-white/35 text-sm flex items-center gap-1.5">
                <CalendarDays
                  className="w-3.5 h-3.5"
                  style={{ color: accent }}
                />
                {formatDate(event.starts_at)}
              </span>
              {event.is_online ? (
                <span className="text-emerald-500/70 text-sm flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" />
                  Online event
                </span>
              ) : (
                (event.venue || event.location) && (
                  <span className="text-white/35 text-sm flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" style={{ color: accent }} />
                    {event.venue || event.location}
                  </span>
                )
              )}
            </div>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/dashboard/organiser/events/${event.id}/edit`}
              className="h-10 px-4 rounded-xl font-bold text-sm text-white/60 hover:text-white border border-white/8 hover:bg-white/4 transition-all duration-200 flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <Link
              href={`/dashboard/organiser/events/${event.id}/orders`}
              className="h-10 px-4 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              View orders
            </Link>
          </div>
        </div>
      </div>

      {/* stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Tickets sold"
          value={MOCK_STATS.total_tickets_sold.toLocaleString()}
          icon={Ticket}
          accent="#f97316"
          sub={`${soldPct}% of capacity`}
        />
        <StatCard
          label="Revenue"
          value={formatPrice(MOCK_STATS.revenue, "KES")}
          icon={TrendingUp}
          accent="#10b981"
        />
        <StatCard
          label="Orders"
          value={MOCK_STATS.total_orders.toLocaleString()}
          icon={ShoppingBag}
          accent="#8b5cf6"
        />
        <StatCard
          label="Checked in"
          value={MOCK_STATS.checked_in_count.toLocaleString()}
          icon={Users}
          accent="#0ea5e9"
          sub="on the day"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ticket types */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-black text-base tracking-tight">
              Ticket Types
            </h2>
            <Link
              href={`/dashboard/organiser/events/${event.id}/ticket-types/new`}
              className="text-orange-400 hover:text-orange-300 text-xs font-bold transition-colors flex items-center gap-1">
              + Add type
            </Link>
          </div>

          <div className="space-y-3">
            {MOCK_TICKET_TYPES.map((tt) => {
              const pct =
                tt.quantity > 0
                  ? Math.round((tt.quantity_sold / tt.quantity) * 100)
                  : 0;
              const remaining = tt.quantity - tt.quantity_sold;
              const isSoldOut = remaining === 0;

              return (
                <div
                  key={tt.id}
                  className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold text-sm">
                          {tt.name}
                        </p>
                        {isSoldOut && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                            Sold out
                          </span>
                        )}
                      </div>
                      {tt.description && (
                        <p className="text-white/30 text-xs">
                          {tt.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-white font-black text-base">
                        {tt.is_free
                          ? "Free"
                          : formatPrice(tt.price, tt.currency)}
                      </p>
                      <p className="text-white/25 text-xs mt-0.5">per ticket</p>
                    </div>
                  </div>

                  {/* progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/35">
                        {tt.quantity_sold.toLocaleString()} sold of{" "}
                        {tt.quantity.toLocaleString()}
                      </span>
                      <span
                        className={`font-bold ${pct >= 90 ? "text-red-400" : pct >= 70 ? "text-amber-400" : "text-white/40"}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background:
                            pct >= 90
                              ? "linear-gradient(to right, #ef4444, #f97316)"
                              : pct >= 70
                                ? "linear-gradient(to right, #f59e0b, #f97316)"
                                : `linear-gradient(to right, ${accent}, ${accent}cc)`,
                        }}
                      />
                    </div>
                    <p className="text-white/20 text-xs">
                      {remaining.toLocaleString()} remaining
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* right column */}
        <div className="space-y-4">
          {/* order breakdown */}
          <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-4">
            <h2 className="text-white font-black text-base tracking-tight">
              Order Breakdown
            </h2>
            <div className="space-y-3">
              {MOCK_BREAKDOWN.map((b) => {
                const total = MOCK_BREAKDOWN.reduce(
                  (s, x) => s + Number(x.count),
                  0,
                );
                const pct =
                  total > 0 ? Math.round((Number(b.count) / total) * 100) : 0;
                return (
                  <div key={b.status} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${orderStatusClass(b.status)}`}>
                        {b.status.toLowerCase()}
                      </span>
                      <span className="text-white/60 text-xs font-bold">
                        {Number(b.count).toLocaleString()}{" "}
                        <span className="text-white/25">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-white/6 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background:
                            b.status === "CONFIRMED"
                              ? "#10b981"
                              : b.status === "PENDING"
                                ? "#f59e0b"
                                : "#ef4444",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* recent orders */}
          <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
              <h2 className="text-white font-black text-base tracking-tight">
                Recent Orders
              </h2>
              <Link
                href={`/dashboard/organiser/events/${event.id}/orders`}
                className="group flex items-center gap-1 text-white/30 hover:text-orange-400 text-xs font-bold transition-colors">
                All
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
            <div>
              {MOCK_RECENT_ORDERS.map((order, i) => (
                <div
                  key={order.id}
                  className={`flex items-center gap-3 px-5 py-3.5 ${
                    i < MOCK_RECENT_ORDERS.length - 1
                      ? "border-b border-white/4"
                      : ""
                  }`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-xs font-bold truncate">
                      {ticketTypeName(order.ticket_type_id)}
                    </p>
                    <p className="text-white/25 text-[10px] mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {timeAgo(order.created_at)} · qty {order.quantity}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${orderStatusClass(order.status)}`}>
                    {order.status.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
