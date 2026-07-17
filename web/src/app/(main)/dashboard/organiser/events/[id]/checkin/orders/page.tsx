"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Search,
  X,
  Ticket,
  ScanLine,
} from "lucide-react";
import { useEventOrders } from "@/hooks/organiser/use-orders";
import { useEventTicketTypes as useOrganiserTicketTypes } from "@/hooks/organiser/use-ticket-types";
import type { OrganiserOrderResponse } from "@/hooks/organiser/use-orders";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CheckedInRow({
  order,
  ticketTypeName,
}: {
  order: OrganiserOrderResponse;
  ticketTypeName: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-white/4 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
        <CheckCircle className="w-4 h-4 text-emerald-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white/80 text-sm font-bold truncate leading-tight">
          {ticketTypeName}
        </p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-white/30 text-xs">qty {order.quantity}</span>
          <span className="text-white/20 text-xs">·</span>
          <span className="text-white/25 text-xs font-mono">
            {order.payment_ref ?? "—"}
          </span>
          <span className="text-white/20 text-xs">·</span>
          <span className="text-white/25 text-xs">
            ordered {formatDate(order.created_at)}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        {order.checked_in_at && (
          <div className="flex items-center gap-1.5 text-emerald-400/70">
            <Clock className="w-3 h-3" />
            <span className="text-xs font-bold">
              {formatDateTime(order.checked_in_at)}
            </span>
          </div>
        )}
        <p className="text-white/20 text-[10px] font-mono mt-0.5 truncate max-w-20">
          {order.id}
        </p>
      </div>
    </div>
  );
}

export default function CheckedInOrdersPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const [search, setSearch] = useState("");

  const { data: orders = [], isLoading: ordersLoading } =
    useEventOrders(eventId);
  const { data: ticketTypes = [], isLoading: ticketTypesLoading } =
    useOrganiserTicketTypes(eventId);

  const ticketTypeMap = useMemo(
    () => new Map(ticketTypes.map((t) => [t.id, t.name])),
    [ticketTypes],
  );

  function ticketTypeName(id: string) {
    return ticketTypeMap.get(id) ?? "Unknown";
  }

  const checkedIn = useMemo(() => orders.filter((o) => o.checked_in), [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return checkedIn;
    return checkedIn.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.payment_ref?.toLowerCase().includes(q) ||
        (ticketTypeMap.get(o.ticket_type_id) ?? "Unknown")
          .toLowerCase()
          .includes(q),
    );
  }, [search, checkedIn, ticketTypeMap]);

  const totalTickets = useMemo(
    () => checkedIn.reduce((sum, o) => sum + o.quantity, 0),
    [checkedIn],
  );

  if (ordersLoading || ticketTypesLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-white/30 text-sm font-semibold">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/organiser/events/${eventId}/checkin`}
          className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-sm font-semibold transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to scanner
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
              Check-in
            </p>
            <h1 className="text-white font-black text-3xl tracking-tight">
              Checked In
            </h1>
            <p className="text-white/30 text-sm mt-1">
              {checkedIn.length} orders · {totalTickets} tickets
            </p>
          </div>
          <Link
            href={`/dashboard/organiser/events/${eventId}/checkin`}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/15 text-sm font-bold transition-all duration-200">
            <ScanLine className="w-4 h-4" />
            <span className="hidden sm:inline">Back to scanner</span>
            <span className="sm:hidden">Scan</span>
          </Link>
        </div>
      </div>

      {/* Search */}
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

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
            <Ticket className="w-6 h-6 text-white/15" />
          </div>
          <p className="text-white/20 text-sm">No checked-in orders found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
          {filtered.map((order) => (
            <CheckedInRow
              key={order.id}
              order={order}
              ticketTypeName={ticketTypeName(order.ticket_type_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
