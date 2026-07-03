"use client";

import Link from "next/link";
import {
  Users,
  CalendarDays,
  ShoppingBag,
  TrendingUp,
  Ticket,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Circle,
  Clock3,
} from "lucide-react";
import { formatPrice } from "@/app/(main)/utils";

// Types
interface AdminStatsResponse {
  total_users: number;
  total_organisers: number;
  total_attendees: number;
  total_events: number;
  published_events: number;
  total_orders: number;
  paid_orders: number;
  total_revenue: number;
}

interface AdminOrderDetailResponse {
  id: string;
  user_id: string;
  event_id: string;
  quantity: number;
  status: string;
  payment_method?: string;
  payment_ref?: string;
  checked_in: boolean;
  created_at: string;
  user_name: string;
  user_email: string;
  event_title: string;
}

// Mock data
const MOCK_STATS: AdminStatsResponse = {
  total_users: 1284,
  total_organisers: 38,
  total_attendees: 1246,
  total_events: 74,
  published_events: 51,
  total_orders: 3892,
  paid_orders: 3601,
  total_revenue: 189500000,
};

const MOCK_RECENT_ORDERS: AdminOrderDetailResponse[] = [
  {
    id: "ord-001",
    user_id: "u1",
    event_id: "evt-001",
    quantity: 2,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "QH7K2L9M",
    checked_in: false,
    created_at: "2026-06-14T18:45:00Z",
    user_name: "Amara Osei",
    user_email: "amara@example.com",
    event_title: "Afropunk Nairobi 2026",
  },
  {
    id: "ord-002",
    user_id: "u2",
    event_id: "evt-001",
    quantity: 1,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "RT4P8N3X",
    checked_in: false,
    created_at: "2026-06-14T17:30:00Z",
    user_name: "Fatima Mwangi",
    user_email: "fatima@example.com",
    event_title: "Afropunk Nairobi 2026",
  },
  {
    id: "ord-003",
    user_id: "u3",
    event_id: "evt-002",
    quantity: 3,
    status: "PENDING",
    payment_method: "MPESA",
    checked_in: false,
    created_at: "2026-06-14T16:15:00Z",
    user_name: "Kwame Otieno",
    user_email: "kwame@example.com",
    event_title: "Tech Summit East Africa",
  },
  {
    id: "ord-004",
    user_id: "u4",
    event_id: "evt-002",
    quantity: 1,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "WQ2J5K8Y",
    checked_in: false,
    created_at: "2026-06-14T15:00:00Z",
    user_name: "Zara Kamau",
    user_email: "zara@example.com",
    event_title: "Tech Summit East Africa",
  },
  {
    id: "ord-005",
    user_id: "u5",
    event_id: "evt-003",
    quantity: 2,
    status: "CANCELLED",
    payment_method: "MPESA",
    checked_in: false,
    created_at: "2026-06-14T14:00:00Z",
    user_name: "Dele Adeyemi",
    user_email: "dele@example.com",
    event_title: "Koroga Festival",
  },
  {
    id: "ord-006",
    user_id: "u6",
    event_id: "evt-003",
    quantity: 1,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "KP3R9T2W",
    checked_in: false,
    created_at: "2026-06-14T13:00:00Z",
    user_name: "Aisha Njoroge",
    user_email: "aisha@example.com",
    event_title: "Koroga Festival",
  },
];

// Helpers
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

function orderStatusConfig(status: string) {
  switch (status) {
    case "CONFIRMED":
      return {
        label: "Confirmed",
        cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        icon: CheckCircle,
      };
    case "PENDING":
      return {
        label: "Pending",
        cls: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        icon: Clock3,
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        cls: "bg-red-500/10 border-red-500/20 text-red-400",
        icon: XCircle,
      };
    default:
      return {
        label: status,
        cls: "bg-white/6 border-white/10 text-white/40",
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
    <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-500/30 to-amber-500/30 border border-orange-500/20 flex items-center justify-center text-orange-300 text-[10px] font-black shrink-0">
      {initials}
    </div>
  );
}

// Stat card
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  href?: string;
}) {
  const inner = (
    <>
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
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-2xl border border-white/8 bg-white/2 p-5 block hover:bg-white/4 hover:border-white/12 transition-all duration-200">
        {inner}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-5">
      {inner}
    </div>
  );
}

// Overview page
export default function AdminOverviewPage() {
  const stats = MOCK_STATS;
  const paidPct =
    stats.total_orders > 0
      ? Math.round((stats.paid_orders / stats.total_orders) * 100)
      : 0;
  const publishedPct =
    stats.total_events > 0
      ? Math.round((stats.published_events / stats.total_events) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
            Admin
          </p>
          <h1 className="text-white font-black text-3xl tracking-tight">
            Overview
          </h1>
          <p className="text-white/30 text-sm mt-1">
            Platform health at a glance.
          </p>
        </div>
      </div>

      {/* stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total users"
          value={stats.total_users.toLocaleString()}
          sub={`${stats.total_organisers} organisers · ${stats.total_attendees} attendees`}
          icon={Users}
          accent="#f97316"
          href="/dashboard/admin/users"
        />
        <StatCard
          label="Events"
          value={stats.total_events.toLocaleString()}
          sub={`${publishedPct}% published`}
          icon={CalendarDays}
          accent="#8b5cf6"
          href="/dashboard/admin/events"
        />
        <StatCard
          label="Orders"
          value={stats.total_orders.toLocaleString()}
          sub={`${paidPct}% paid`}
          icon={ShoppingBag}
          accent="#0ea5e9"
          href="/dashboard/admin/orders"
        />
        <StatCard
          label="Revenue"
          value={formatPrice(stats.total_revenue, "KES")}
          sub="All time"
          icon={TrendingUp}
          accent="#10b981"
        />
      </div>

      {/* secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-400/60" />
            <p className="text-white/35 text-xs font-bold uppercase tracking-widest">
              Organisers
            </p>
          </div>
          <p className="text-white font-black text-2xl tracking-tight">
            {stats.total_organisers.toLocaleString()}
          </p>
          <Link
            href="/dashboard/admin/organisers"
            className="group flex items-center gap-1 text-white/25 hover:text-orange-400 text-xs font-bold transition-colors">
            Manage
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-emerald-400/60" />
            <p className="text-white/35 text-xs font-bold uppercase tracking-widest">
              Published
            </p>
          </div>
          <p className="text-white font-black text-2xl tracking-tight">
            {stats.published_events.toLocaleString()}
          </p>
          <p className="text-white/25 text-xs">
            {stats.total_events - stats.published_events} unpublished
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Ticket className="w-3.5 h-3.5 text-blue-400/60" />
            <p className="text-white/35 text-xs font-bold uppercase tracking-widest">
              Paid orders
            </p>
          </div>
          <p className="text-white font-black text-2xl tracking-tight">
            {stats.paid_orders.toLocaleString()}
          </p>
          <p className="text-white/25 text-xs">
            {stats.total_orders - stats.paid_orders} unpaid
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-purple-400/60" />
            <p className="text-white/35 text-xs font-bold uppercase tracking-widest">
              Attendees
            </p>
          </div>
          <p className="text-white font-black text-2xl tracking-tight">
            {stats.total_attendees.toLocaleString()}
          </p>
          <p className="text-white/25 text-xs">registered accounts</p>
        </div>
      </div>

      {/* recent orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-black text-base tracking-tight">
            Recent Orders
          </h2>
          <Link
            href="/dashboard/admin/orders"
            className="group flex items-center gap-1 text-white/35 hover:text-orange-400 text-xs font-bold transition-colors">
            View all
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
          {MOCK_RECENT_ORDERS.map((order, i) => {
            const sc = orderStatusConfig(order.status);
            const StatusIcon = sc.icon;

            return (
              <div
                key={order.id}
                className={`flex items-center gap-4 px-5 py-4 ${
                  i < MOCK_RECENT_ORDERS.length - 1
                    ? "border-b border-white/4"
                    : ""
                }`}>
                <UserInitials name={order.user_name} />

                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm font-bold truncate leading-tight">
                    {order.user_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-white/30 text-xs truncate">
                      {order.event_title}
                    </span>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-white/25 text-xs">
                      qty {order.quantity}
                    </span>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-white/20 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(order.created_at)}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ${sc.cls}`}>
                  <StatusIcon className="w-2.5 h-2.5" />
                  {sc.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
