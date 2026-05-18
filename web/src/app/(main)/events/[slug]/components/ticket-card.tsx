import { CheckCircle } from "lucide-react";
import { AvailableTicketTypesResponse } from "../page";
import { formatPrice } from "@/app/(main)/utils";

export default function TicketCard({
  ticket,
  accent,
  selected,
  onSelect,
}: {
  ticket: AvailableTicketTypesResponse;
  accent: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border p-5 transition-all duration-200 ${
        selected
          ? "border-orange-500/50 bg-orange-500/8"
          : "border-white/8 bg-white/2 hover:bg-white/4 hover:border-white/12"
      }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white font-bold text-sm">{ticket.name}</p>
            {selected && (
              <CheckCircle className="w-4 h-4 text-orange-400 shrink-0" />
            )}
          </div>
          {ticket.description && (
            <p className="text-white/35 text-xs leading-relaxed">
              {ticket.description}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          {ticket.is_free ? (
            <span className="text-emerald-400 font-black text-sm">Free</span>
          ) : (
            <span className="text-white font-black text-sm">
              {formatPrice(ticket.price, ticket.currency)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
