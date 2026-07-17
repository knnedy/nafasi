"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
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
  Loader2,
} from "lucide-react";
import {
  useEventOrders,
  useEventAvailableTicketTypes,
} from "@/hooks/use-organiser";
import { useParams } from "next/navigation";
import { useEventByID } from "@/hooks/use-events";

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusConfig(status: string) {
  switch (status.toUpperCase()) {
    case "CONFIRMED":
      return {
        label: "Confirmed",
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
    default:
      return {
        label: status,
        icon: Circle,
        cls: "bg-white/5 border-white/10 text-white/40",
      };
  }
}

const FILTERS = ["All", "Confirmed", "Pending", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];

function OrderDetail({ order }: { order: OrganiserOrderResponse }) {
  return (
    <div className="px-5 pb-5 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/5 mt-0">
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

function OrderRow({
  order,
  ticketName,
}: {
  order: OrganiserOrderResponse;
  ticketName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const sc = statusConfig(order.status);
  const StatusIcon = sc.icon;

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left">
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
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
            <span className="text-white/30 text-xs">qty {order.quantity}</span>
            <span className="text-white/20 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(order.created_at)}
            </span>
            {order.checked_in && (
              <span className="text-emerald-400/70 text-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Checked in
              </span>
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

export default function OrganiserEventOrdersPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");

  const params = useParams();

  const eventId = (params?.eventId || params?.id) as string;

  const { data: event } = useEventByID(eventId);

  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError,
  } = useEventOrders(eventId);

  const { data: ticketTypes = [], isLoading: ticketsLoading } =
    useEventAvailableTicketTypes(eventId);

  const ticketTypesMap = useMemo(() => {
    return ticketTypes.reduce<Record<string, string>>((acc, curr) => {
      acc[curr.id] = curr.name;
      return acc;
    }, {});
  }, [ticketTypes]);

  const counts = useMemo(() => {
    return orders.reduce<Record<string, number>>((acc, o) => {
      const statusKey = o.status.toUpperCase();
      acc[statusKey] = (acc[statusKey] ?? 0) + 1;
      return acc;
    }, {});
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesFilter =
        activeFilter === "All" ||
        o.status.toUpperCase() === activeFilter.toUpperCase();

      const ticketName = ticketTypesMap[o.ticket_type_id] ?? "";
      const matchesSearch =
        search.trim() === "" ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.payment_ref?.toLowerCase().includes(search.toLowerCase()) ||
        ticketName.toLowerCase().includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [orders, activeFilter, search, ticketTypesMap]);

  if (ordersLoading || ticketsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
        <p className="text-white/40 text-sm">Loading event orders...</p>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <XCircle className="w-8 h-8 text-red-500/80" />
        <p className="text-white/60 text-sm">Failed to load order records.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* back + header */}
      <div>
        <Link
          href={`/dashboard/organiser/events/${eventId}`}
          className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-sm font-semibold transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to event
        </Link>
        <div>
          <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1 line-clamp-1">
            {event?.title || event?.title || "Event Management"}
          </p>
          <h1 className="text-white font-black text-3xl tracking-tight">
            Orders
          </h1>
          <p className="text-white/30 text-sm mt-1">
            {orders.length} total · {counts["CONFIRMED"] ?? 0} confirmed ·{" "}
            {counts["PENDING"] ?? 0} pending
          </p>
        </div>
      </div>

      {/* search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, payment ref, ticket type…"
            className="w-full h-11 pl-11 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/10 transition-all duration-200"
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
                  : "text-white/35 hover:text-white/60 hover:bg-white/5"
              }`}>
              {f}
              {f !== "All" && (counts[f.toUpperCase()] ?? 0) > 0 && (
                <span className="ml-1.5 text-white/20">
                  {counts[f.toUpperCase()]}
                </span>
              )}
            </button>
          ))}
          <span className="text-white/20 text-xs ml-auto shrink-0">
            {filtered.length} {filtered.length === 1 ? "order" : "orders"}
          </span>
        </div>
      </div>

      {/* orders list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Ticket className="w-6 h-6 text-white/15" />
          </div>
          <p className="text-white/20 text-sm">No orders found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {filtered.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              ticketName={
                ticketTypesMap[order.ticket_type_id] ?? "Unknown Ticket"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
