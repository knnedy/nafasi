"use client";

import { useState, useMemo } from "react";
import {
  Ticket,
  Search,
  X,
  CheckCircle,
  Clock,
  XCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  QrCode,
  CalendarDays,
  Loader2,
} from "lucide-react";
import {
  useOrganiserOrders,
  useOrganiserEvents,
  type OrganiserOrderResponse,
} from "@/hooks/use-organiser";

// Helpers
function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusConfig(status: string) {
  switch (status?.toUpperCase()) {
    case "CONFIRMED":
    case "PAID":
      return {
        label: status,
        icon: CheckCircle,
        cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      };
    case "PENDING":
      return {
        label: "Pending",
        icon: Clock,
        cls: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        icon: XCircle,
        cls: "bg-red-500/10 border-red-500/20 text-red-400",
      };
    case "REFUNDED":
      return {
        label: "Refunded",
        icon: XCircle,
        cls: "bg-purple-500/10 border-purple-500/20 text-purple-400",
      };
    case "FAILED":
      return {
        label: "Failed",
        icon: XCircle,
        cls: "bg-red-500/10 border-red-500/20 text-red-400",
      };
    default:
      return {
        label: status || "Unknown",
        icon: Circle,
        cls: "bg-white/6 border-white/10 text-white/40",
      };
  }
}

const STATUS_FILTERS = [
  "All",
  "Confirmed",
  "Pending",
  "Cancelled",
  "Refunded",
  "Failed",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

// Expanded order detail
function OrderDetail({ order }: { order: OrganiserOrderResponse }) {
  return (
    <div className="px-5 pb-5 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/4">
      <div>
        <p className="text-white/25 text-[10px] font-black uppercase tracking-widest mb-1">
          User ID
        </p>
        <p className="text-white/50 text-xs font-mono truncate">
          {order.user_id}
        </p>
      </div>
      <div>
        <p className="text-white/25 text-[10px] font-black uppercase tracking-widest mb-1">
          Order ID
        </p>
        <p className="text-white/50 text-xs font-mono truncate">{order.id}</p>
      </div>
      <div>
        <p className="text-white/25 text-[10px] font-black uppercase tracking-widest mb-1">
          Payment
        </p>
        <p className="text-white/50 text-xs">
          {order.payment_method ?? "—"}
          {order.payment_ref && (
            <span className="text-white/25 font-mono ml-1">
              · {order.payment_ref}
            </span>
          )}
        </p>
      </div>
      <div>
        <p className="text-white/25 text-[10px] font-black uppercase tracking-widest mb-1">
          Check-in
        </p>
        {order.checked_in ? (
          <p className="text-emerald-400 text-xs flex items-center gap-1">
            <CheckCircle className="w-3 h-3 shrink-0" />
            {order.checked_in_at ? formatDateTime(order.checked_in_at) : "Yes"}
          </p>
        ) : (
          <p className="text-white/25 text-xs">Not checked in</p>
        )}
      </div>
    </div>
  );
}

// Order row
function OrderRow({
  order,
  eventName,
}: {
  order: OrganiserOrderResponse;
  eventName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const sc = statusConfig(order.status);
  const StatusIcon = sc.icon;

  // Fallback since the payload only has the ID
  const ticketName = order.ticket_type_id
    ? `Ticket (${order.ticket_type_id.split("-")[0]})`
    : "Standard Ticket";

  return (
    <div className="border-b border-white/4 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors text-left">
        <div className="w-9 h-9 rounded-xl bg-white/4 border border-white/6 flex items-center justify-center shrink-0">
          {order.payment_ref ? (
            <QrCode className="w-4 h-4 text-white/25" />
          ) : (
            <Ticket className="w-4 h-4 text-white/25" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-sm font-bold truncate leading-tight">
            {ticketName}
          </p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-white/30 text-xs flex items-center gap-1">
              <CalendarDays className="w-3 h-3 shrink-0" />
              {eventName}
            </span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-white/30 text-xs">qty {order.quantity}</span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-white/25 text-xs">
              {formatDate(order.created_at)}
            </span>
            {order.checked_in && (
              <>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-emerald-400/70 text-xs flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Checked in
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 ${sc.cls}`}>
            <StatusIcon className="w-2.5 h-2.5" />
            {sc.label}
          </span>
          <div className="text-white/20 hover:text-white/50 transition-colors">
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </button>

      {expanded && <OrderDetail order={order} />}
    </div>
  );
}

export default function OrganiserOrdersPage() {
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("All");
  const [activeEvent, setActiveEvent] = useState<string>("All");
  const [search, setSearch] = useState("");

  // Fetch events for mapping IDs to names and building the filter
  const { data: events = [] } = useOrganiserEvents();
  const eventLookup = useMemo(() => {
    return events.reduce(
      (acc, e) => {
        acc[e.id] = e.title;
        return acc;
      },
      {} as Record<string, string>,
    );
  }, [events]);

  // Fetch orders (driving status through the API)
  const { data: orders = [], isLoading } = useOrganiserOrders({
    status: activeStatus === "All" ? undefined : activeStatus,
    limit: 100, // Reasonable default for the dashboard view
  });

  // Client-side filtering for search and event selection
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesEvent = activeEvent === "All" || o.event_id === activeEvent;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        o.id.toLowerCase().includes(q) ||
        (o.payment_ref?.toLowerCase() || "").includes(q) ||
        (eventLookup[o.event_id]?.toLowerCase() || "").includes(q);

      return matchesEvent && matchesSearch;
    });
  }, [orders, activeEvent, search, eventLookup]);

  const totalTickets = useMemo(
    () => orders.reduce((sum, o) => sum + o.quantity, 0),
    [orders],
  );

  const checkedInCount = useMemo(
    () => orders.filter((o) => o.checked_in).length,
    [orders],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
          Organiser
        </p>
        <h1 className="text-white font-black text-3xl tracking-tight">
          Orders
        </h1>
        <p className="text-white/30 text-sm mt-1">
          {orders.length} total fetched · {totalTickets} tickets ·{" "}
          {checkedInCount} checked in
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID, payment ref, or event name…"
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

      {/* Filters */}
      <div className="space-y-2">
        {/* Event filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveEvent("All")}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeEvent === "All"
                ? "bg-orange-500/15 border border-orange-500/30 text-orange-400"
                : "text-white/35 hover:text-white/60 hover:bg-white/4"
            }`}>
            All events
          </button>
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => setActiveEvent(event.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeEvent === event.id
                  ? "bg-orange-500/15 border border-orange-500/30 text-orange-400"
                  : "text-white/35 hover:text-white/60 hover:bg-white/4"
              }`}>
              {event.title}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveStatus(f)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeStatus === f
                  ? "bg-white/10 border border-white/20 text-white/80"
                  : "text-white/35 hover:text-white/60 hover:bg-white/4"
              }`}>
              {f}
            </button>
          ))}
          <span className="text-white/20 text-xs ml-auto shrink-0">
            {filtered.length} {filtered.length === 1 ? "order" : "orders"}
          </span>
        </div>
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-white/40 font-bold text-sm tracking-widest uppercase">
            Loading Orders
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
            <Ticket className="w-6 h-6 text-white/15" />
          </div>
          <p className="text-white/20 text-sm">No orders found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
          {filtered.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              eventName={eventLookup[order.event_id] || "Unknown Event"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
