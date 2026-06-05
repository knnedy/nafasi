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
} from "lucide-react";

// Types
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

// Mock ticket types for name lookup
const MOCK_TICKET_TYPES: Record<string, string> = {
  tt1: "General Admission",
  tt2: "VIP",
  tt3: "Early Bird",
};

// Mock orders
const MOCK_ORDERS: OrganiserOrderResponse[] = [
  {
    id: "ord-001",
    user_id: "u1",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    ticket_type_id: "tt2",
    quantity: 2,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "QH7K2L9M",
    checked_in: true,
    checked_in_at: "2026-06-14T18:45:00Z",
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
  {
    id: "ord-006",
    user_id: "u6",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    ticket_type_id: "tt2",
    quantity: 1,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "KP3R9T2W",
    checked_in: false,
    created_at: "2026-05-23T14:00:00Z",
  },
  {
    id: "ord-007",
    user_id: "u7",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    ticket_type_id: "tt3",
    quantity: 2,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "NL8M4Q6X",
    checked_in: true,
    checked_in_at: "2026-06-14T19:10:00Z",
    created_at: "2026-05-22T10:30:00Z",
  },
  {
    id: "ord-008",
    user_id: "u8",
    event_id: "550e8400-e29b-41d4-a716-446655440001",
    ticket_type_id: "tt1",
    quantity: 4,
    status: "PENDING",
    payment_method: "MPESA",
    checked_in: false,
    created_at: "2026-05-21T16:20:00Z",
  },
];

// Helpers
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

// Status config
function statusConfig(status: string) {
  switch (status) {
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
        cls: "bg-white/6 border-white/10 text-white/40",
      };
  }
}

const FILTERS = ["All", "Confirmed", "Pending", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];

// Expanded order row detail
function OrderDetail({ order }: { order: OrganiserOrderResponse }) {
  return (
    <div className="px-5 pb-5 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/4 mt-0">
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
function OrderRow({ order }: { order: OrganiserOrderResponse }) {
  const [expanded, setExpanded] = useState(false);
  const sc = statusConfig(order.status);
  const StatusIcon = sc.icon;
  const ticketName = MOCK_TICKET_TYPES[order.ticket_type_id] ?? "Unknown";

  return (
    <div className="border-b border-white/4 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors text-left">
        {/* ticket type icon */}
        <div className="w-9 h-9 rounded-xl bg-white/4 border border-white/6 flex items-center justify-center shrink-0">
          {order.payment_ref ? (
            <QrCode className="w-4 h-4 text-white/25" />
          ) : (
            <Ticket className="w-4 h-4 text-white/25" />
          )}
        </div>

        {/* info */}
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

        {/* status + expand */}
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

// Page
export default function OrganiserEventOrdersPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");

  const eventId = "550e8400-e29b-41d4-a716-446655440001";

  const filtered = useMemo(() => {
    return MOCK_ORDERS.filter((o) => {
      const matchesFilter =
        activeFilter === "All" || o.status === activeFilter.toUpperCase();
      const matchesSearch =
        search.trim() === "" ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.payment_ref?.toLowerCase().includes(search.toLowerCase()) ||
        MOCK_TICKET_TYPES[o.ticket_type_id]
          ?.toLowerCase()
          .includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search]);

  // summary counts
  const counts = useMemo(() => {
    return MOCK_ORDERS.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});
  }, []);

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
          <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
            Afropunk Nairobi 2026
          </p>
          <h1 className="text-white font-black text-3xl tracking-tight">
            Orders
          </h1>
          <p className="text-white/30 text-sm mt-1">
            {MOCK_ORDERS.length} total · {counts["CONFIRMED"] ?? 0} confirmed ·{" "}
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
          <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
            <Ticket className="w-6 h-6 text-white/15" />
          </div>
          <p className="text-white/20 text-sm">No orders found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
          {filtered.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
