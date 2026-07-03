"use client";

import { useState, useMemo } from "react";
import {
  Search,
  X,
  CheckCircle,
  XCircle,
  Circle,
  Clock,
  Clock3,
  ShoppingBag,
  QrCode,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Types
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
const MOCK_ORDERS: AdminOrderDetailResponse[] = [
  {
    id: "ord-001",
    user_id: "u1",
    event_id: "evt-001",
    quantity: 2,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "QH7K2L9M",
    checked_in: true,
    created_at: "2026-06-14T18:45:00Z",
    user_name: "Amara Osei",
    user_email: "amara@example.com",
    event_title: "Afropunk Nairobi 2026",
  },
  {
    id: "ord-002",
    user_id: "u3",
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
    user_id: "u8",
    event_id: "evt-002",
    quantity: 3,
    status: "PENDING",
    payment_method: "MPESA",
    checked_in: false,
    created_at: "2026-06-14T16:15:00Z",
    user_name: "Tendai Moyo",
    user_email: "tendai@example.com",
    event_title: "Tech Summit East Africa",
  },
  {
    id: "ord-004",
    user_id: "u6",
    event_id: "evt-002",
    quantity: 1,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "WQ2J5K8Y",
    checked_in: false,
    created_at: "2026-06-14T15:00:00Z",
    user_name: "Dele Adeyemi",
    user_email: "dele@example.com",
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
    user_name: "Zara Kamau",
    user_email: "zara@example.com",
    event_title: "Koroga Festival",
  },
  {
    id: "ord-006",
    user_id: "u1",
    event_id: "evt-003",
    quantity: 1,
    status: "CONFIRMED",
    payment_method: "MPESA",
    payment_ref: "KP3R9T2W",
    checked_in: false,
    created_at: "2026-06-14T13:00:00Z",
    user_name: "Amara Osei",
    user_email: "amara@example.com",
    event_title: "Koroga Festival",
  },
  {
    id: "ord-007",
    user_id: "u3",
    event_id: "evt-001",
    quantity: 2,
    status: "REFUNDED",
    payment_method: "MPESA",
    payment_ref: "NL8M4Q6X",
    checked_in: false,
    created_at: "2026-06-13T10:00:00Z",
    user_name: "Fatima Mwangi",
    user_email: "fatima@example.com",
    event_title: "Afropunk Nairobi 2026",
  },
  {
    id: "ord-008",
    user_id: "u8",
    event_id: "evt-002",
    quantity: 4,
    status: "FAILED",
    payment_method: "MPESA",
    checked_in: false,
    created_at: "2026-06-13T09:00:00Z",
    user_name: "Tendai Moyo",
    user_email: "tendai@example.com",
    event_title: "Tech Summit East Africa",
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

function statusConfig(status: string) {
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
    case "REFUNDED":
      return {
        label: "Refunded",
        cls: "bg-purple-500/10 border-purple-500/20 text-purple-400",
        icon: XCircle,
      };
    case "FAILED":
      return {
        label: "Failed",
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
    <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/15 flex items-center justify-center text-orange-300 text-[10px] font-black shrink-0">
      {initials}
    </div>
  );
}

// Expanded order detail
function OrderDetail({ order }: { order: AdminOrderDetailResponse }) {
  return (
    <div className="px-5 pb-5 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/4">
      <div>
        <p className="text-white/25 text-[10px] font-black uppercase tracking-widest mb-1">
          Order ID
        </p>
        <p className="text-white/50 text-xs font-mono truncate">{order.id}</p>
      </div>
      <div>
        <p className="text-white/25 text-[10px] font-black uppercase tracking-widest mb-1">
          User
        </p>
        <p className="text-white/50 text-xs truncate">{order.user_name}</p>
        <p className="text-white/25 text-[10px] truncate">{order.user_email}</p>
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
            Checked in
          </p>
        ) : (
          <p className="text-white/25 text-xs">Not checked in</p>
        )}
      </div>
    </div>
  );
}

// Order row
function OrderRow({ order }: { order: AdminOrderDetailResponse }) {
  const [expanded, setExpanded] = useState(false);
  const sc = statusConfig(order.status);
  const StatusIcon = sc.icon;

  return (
    <div className="border-b border-white/4 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors text-left">
        <UserInitials name={order.user_name} />

        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-sm font-bold truncate leading-tight">
            {order.user_name}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-white/30 text-xs truncate max-w-40">
              {order.event_title}
            </span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-white/30 text-xs">qty {order.quantity}</span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-white/20 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(order.created_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {order.payment_ref && (
            <QrCode className="w-3.5 h-3.5 text-white/15" />
          )}
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

const STATUS_FILTERS = [
  "CONFIRMED",
  "PENDING",
  "CANCELLED",
  "REFUNDED",
  "FAILED",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

// Page
export default function AdminOrdersPage() {
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("CONFIRMED");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_ORDERS.filter((o) => {
      const matchesStatus = o.status === activeStatus;
      const matchesSearch =
        q === "" ||
        o.id.toLowerCase().includes(q) ||
        o.user_name.toLowerCase().includes(q) ||
        o.user_email.toLowerCase().includes(q) ||
        o.event_title.toLowerCase().includes(q) ||
        o.payment_ref?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, search]);

  const statusCounts = useMemo(() => {
    return MOCK_ORDERS.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});
  }, []);

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
          Admin
        </p>
        <h1 className="text-white font-black text-3xl tracking-tight">
          Orders
        </h1>
        <p className="text-white/30 text-sm mt-1">
          {MOCK_ORDERS.length} total · {statusCounts["CONFIRMED"] ?? 0}{" "}
          confirmed · {statusCounts["PENDING"] ?? 0} pending
        </p>
      </div>

      {/* search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user, event, order ID, payment ref…"
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

      {/* status filter — required by backend */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveStatus(f)}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeStatus === f
                ? "bg-orange-500/15 border border-orange-500/30 text-orange-400"
                : "text-white/35 hover:text-white/60 hover:bg-white/4"
            }`}>
            {f.charAt(0) + f.slice(1).toLowerCase()}
            {(statusCounts[f] ?? 0) > 0 && (
              <span className="ml-1.5 text-white/20">{statusCounts[f]}</span>
            )}
          </button>
        ))}
        <span className="text-white/20 text-xs ml-auto shrink-0">
          {filtered.length} {filtered.length === 1 ? "order" : "orders"}
        </span>
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
            <ShoppingBag className="w-6 h-6 text-white/15" />
          </div>
          <p className="text-white/20 text-sm">
            No {activeStatus.toLowerCase()} orders.
          </p>
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
