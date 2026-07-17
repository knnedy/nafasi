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
  Loader2,
} from "lucide-react";
import { accentForId, formatPrice } from "@/lib/utils";
import { useOrganiserEvents } from "@/hooks/organiser/use-events";
import { useOrganiserRecentOrders } from "@/hooks/organiser/use-orders";
import { useAllEventsStats } from "@/hooks/organiser/use-stats";

function timeAgo(iso: string) {
  if (!iso) return "Just now";
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
  switch (status.toUpperCase()) {
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
  switch (status.toUpperCase()) {
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
  isLoading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  sub?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-5 flex flex-col gap-3 relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
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
      <div className="relative z-10">
        {isLoading ? (
          <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
        ) : (
          <p className="text-white font-black text-2xl tracking-tight">
            {value}
          </p>
        )}
        {sub && <p className="text-white/25 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// Overview page
export default function OrganiserOverviewPage() {
  const { data: events = [], isLoading: isLoadingEvents } =
    useOrganiserEvents();
  const { data: recentOrders = [], isLoading: isLoadingOrders } =
    useOrganiserRecentOrders(5);

  const statsQueries = useAllEventsStats(events);

  const loadedStats = statsQueries
    .map((q) => q.data)
    .filter((data) => data !== undefined);

  const isLoadingStats = statsQueries.some((q) => q.isLoading);

  const totalTicketsSold = loadedStats.reduce((s, e) => s + e.tickets_sold, 0);
  const totalRevenue = loadedStats.reduce((s, e) => s + e.revenue, 0);
  const totalOrdersCount = loadedStats.reduce((s, e) => s + e.orders, 0);

  const totalEvents = events.length;
  const publishedEvents = events.filter((e) => e.status === "PUBLISHED").length;

  if (isLoadingEvents) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-white/40 font-bold text-sm tracking-widest uppercase">
          Loading Dashboard
        </p>
      </div>
    );
  }

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
          value={totalEvents}
          icon={CalendarDays}
          accent="#f97316"
          sub={`${publishedEvents} published`}
        />
        <StatCard
          label="Tickets sold"
          value={totalTicketsSold.toLocaleString()}
          icon={Ticket}
          accent="#8b5cf6"
          isLoading={isLoadingStats}
        />
        <StatCard
          label="Total orders"
          value={totalOrdersCount.toLocaleString()}
          icon={ShoppingBag}
          accent="#0ea5e9"
          isLoading={isLoadingStats}
        />
        <StatCard
          label="Revenue"
          value={formatPrice(totalRevenue, "KES")}
          icon={TrendingUp}
          accent="#10b981"
          sub="All time"
          isLoading={isLoadingStats}
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
            {events.length === 0 ? (
              <div className="p-8 rounded-2xl border border-white/6 bg-white/2 text-center">
                <p className="text-white/40 text-sm">No events created yet.</p>
              </div>
            ) : (
              events.map((event) => {
                const accent = accentForId(event.id);
                // Look up specific stat query for this event
                const statQuery = statsQueries.find(
                  (q) => q.data?.eventId === event.id,
                );
                const stats = statQuery?.data || { tickets_sold: 0 };
                const isStatLoading = statQuery?.isLoading;

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
                        {new Date(event.starts_at).getDate() || "-"}
                      </span>
                      <span
                        className="text-[9px] font-bold tracking-widest mt-0.5"
                        style={{ color: `${accent}80` }}>
                        {event.starts_at
                          ? new Date(event.starts_at)
                              .toLocaleDateString("en-KE", { month: "short" })
                              .toUpperCase()
                          : "TBD"}
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
                      {isStatLoading ? (
                        <div className="h-4 w-8 bg-white/10 rounded animate-pulse ml-auto mb-1" />
                      ) : (
                        <p className="text-white font-black text-sm">
                          {stats.tickets_sold.toLocaleString()}
                        </p>
                      )}
                      <p className="text-white/25 text-[10px] mt-0.5">
                        tickets sold
                      </p>
                    </div>

                    <ArrowUpRight className="w-4 h-4 text-white/15 group-hover:text-white/40 shrink-0 transition-colors" />
                  </Link>
                );
              })
            )}
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
            {isLoadingOrders ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-white/40 text-sm">No recent orders found.</p>
              </div>
            ) : (
              recentOrders.map((order, i) => {
                // Cross-reference the events array to get the title
                const parentEvent = events.find((e) => e.id === order.event_id);
                const eventTitle = parentEvent?.title || "Unknown Event";

                return (
                  <div
                    key={order.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${
                      i < recentOrders.length - 1
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
                        {order.quantity}x Ticket{" "}
                        {order.ticket_type_id
                          ? `(${order.ticket_type_id.split("-")[0]})`
                          : ""}
                      </p>
                      <p className="text-white/25 text-[10px] truncate mt-0.5">
                        {eventTitle}
                      </p>
                    </div>

                    {/* right */}
                    <div className="shrink-0 text-right space-y-1">
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border block ${orderStatusConfig(
                          order.status,
                        )}`}>
                        {order.status.toLowerCase()}
                      </span>
                      <p className="text-white/20 text-[10px] flex items-center gap-1 justify-end">
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo(order.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
