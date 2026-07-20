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
  AlertTriangle,
  Tag,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAdminStats } from "@/hooks/admin/use-stats";
import { useAdminRecentOrders } from "@/hooks/admin/use-orders";
import { useAdminEvents } from "@/hooks/admin/use-events";
import { useAdminOrganisers } from "@/hooks/admin/use-organisers";
import { useEventCategories } from "@/hooks/use-events";

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

// Event status donut chart
const EVENT_STATUS_CONFIG = [
  {
    key: "PUBLISHED",
    label: "Published",
    color: "#10b981",
  },
  {
    key: "DRAFT",
    label: "Draft",
    color: "#ffffff30",
  },
  {
    key: "CANCELLED",
    label: "Cancelled",
    color: "#ef4444",
  },
  {
    key: "COMPLETED",
    label: "Completed",
    color: "#3b82f6",
  },
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: item } = payload[0];
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0d0b]/95 backdrop-blur-sm px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: item.color }}
        />
        <span className="text-white/60 text-xs font-bold">{name}</span>
      </div>
      <p className="text-white font-black text-lg mt-0.5 leading-none">
        {value}
      </p>
    </div>
  );
}

function EventStatusBreakdown({
  breakdown,
  total,
}: {
  breakdown: Record<string, number>;
  total: number;
}) {
  const chartData = EVENT_STATUS_CONFIG.map(({ key, label, color }) => ({
    name: label,
    value: breakdown[key] ?? 0,
    color,
  })).filter((d) => d.value > 0);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-5 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-white/25" />
          <p className="text-white/35 text-xs font-bold uppercase tracking-widest">
            Events by status
          </p>
        </div>
        <Link
          href="/dashboard/admin/events"
          className="group flex items-center gap-1 text-white/25 hover:text-orange-400 text-xs font-bold transition-colors">
          View all
          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* donut chart */}
      <div
        className="relative flex items-center justify-center"
        style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={98}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              animationBegin={0}
              animationDuration={900}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-white font-black text-4xl tracking-tight leading-none">
            {total}
          </p>
          <p className="text-white/25 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
            Total events
          </p>
        </div>
      </div>

      {/* legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {EVENT_STATUS_CONFIG.map(({ key, label, color }) => {
          const count = breakdown[key] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} className="flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider leading-none">
                  {label}
                </p>
                <p className="text-white/80 text-sm font-black leading-tight mt-0.5">
                  {count}
                  <span className="text-white/25 text-xs font-normal ml-1">
                    {pct}%
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Overview page
export default function AdminOverviewPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: recentOrders = [], isLoading: ordersLoading } =
    useAdminRecentOrders(6);
  const { data: events = [], isLoading: eventsLoading } = useAdminEvents();
  const { data: organisers = [], isLoading: organisersLoading } =
    useAdminOrganisers();
  const { data: categories = [], isLoading: categoriesLoading } =
    useEventCategories();

  if (
    statsLoading ||
    ordersLoading ||
    eventsLoading ||
    organisersLoading ||
    categoriesLoading ||
    !stats
  ) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-white/30 text-sm font-semibold">Loading...</p>
      </div>
    );
  }

  const paidPct =
    stats.total_orders > 0
      ? Math.round((stats.paid_orders / stats.total_orders) * 100)
      : 0;
  const publishedPct =
    stats.total_events > 0
      ? Math.round((stats.published_events / stats.total_events) * 100)
      : 0;

  const eventStatusBreakdown = events.reduce<Record<string, number>>(
    (acc, e) => {
      acc[e.status] = (acc[e.status] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const pendingOrganisers = organisers.filter((o) => !o.is_verified).length;

  return (
    <div className="space-y-8">
      {/* header */}
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

      {/* pending organisers alert */}
      {pendingOrganisers > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/6 border border-amber-500/15">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-amber-400/90 text-sm font-bold">
              {pendingOrganisers} organiser
              {pendingOrganisers === 1 ? "" : "s"} awaiting verification
            </p>
            <p className="text-amber-400/50 text-xs mt-0.5">
              Review and approve their accounts to allow event publishing.
            </p>
          </div>
          <Link
            href="/dashboard/admin/organisers?status=pending"
            className="shrink-0 h-8 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/15 text-xs font-bold transition-colors flex items-center">
            Review
          </Link>
        </div>
      )}

      {/* primary stats */}
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

        <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-emerald-400/60" />
            <p className="text-white/35 text-xs font-bold uppercase tracking-widest">
              Categories
            </p>
          </div>
          <p className="text-white font-black text-2xl tracking-tight">
            {categories.length}
          </p>
          <Link
            href="/dashboard/admin/categories"
            className="group flex items-center gap-1 text-white/25 hover:text-orange-400 text-xs font-bold transition-colors">
            Manage
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* event status breakdown + recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <EventStatusBreakdown
            breakdown={eventStatusBreakdown}
            total={stats.total_events}
          />
        </div>

        <div className="lg:col-span-3 space-y-4">
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

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-white/6 bg-white/2">
              <p className="text-white/20 text-sm">No orders yet.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
              {recentOrders.map((order, i) => {
                const sc = orderStatusConfig(order.status);
                const StatusIcon = sc.icon;

                return (
                  <div
                    key={order.id}
                    className={`flex items-center gap-4 px-5 py-4 ${
                      i < recentOrders.length - 1
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
          )}
        </div>
      </div>
    </div>
  );
}
