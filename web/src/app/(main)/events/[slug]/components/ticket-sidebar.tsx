import { EventResponse } from "@/app/(main)/mock_events";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  LoaderCircle,
  LogIn,
  MapPin,
  Minus,
  Phone,
  Plus,
  Ticket,
  Wifi,
  X,
} from "lucide-react";
import { useState } from "react";
import { AvailableTicketTypesResponse } from "../page";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import { api, APIError } from "@/lib/api";
import {
  formatDateLong,
  formatPhoneNumber,
  formatPrice,
  formatTime,
} from "@/app/(main)/utils";
import TicketCard from "./ticket-card";

type CheckoutStep = "idle" | "payment" | "processing" | "success";

export default function TicketSidebar({
  accent,
  event,
  tickets,
}: {
  accent: string;
  event: EventResponse;
  tickets: AvailableTicketTypesResponse[];
}) {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState("");
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("idle");

  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const selectedTicketData = tickets.find((t) => t.id === selectedTicket);
  const totalPrice = selectedTicketData
    ? selectedTicketData.price * quantity
    : 0;

  const handleTicketSelect = (id: string) => {
    setSelectedTicket(selectedTicket === id ? null : id);
    setQuantity(1);
    setPhone("");
    setCheckoutStep("idle");
  };

  const handleBuyClick = () => {
    if (!isAuthenticated) {
      router.push(`/signin?redirect=/events/${event.slug}`);
      return;
    }
    setCheckoutStep("payment");
  };

  const handlePayment = async () => {
    if (!selectedTicketData) return;

    if (!selectedTicketData.is_free && !phone.trim()) {
      toast.error("Please enter your M-Pesa phone number.");
      return;
    }

    setCheckoutStep("processing");

    let formattedPhone = "";
    if (!selectedTicketData.is_free) {
      try {
        formattedPhone = formatPhoneNumber(phone);
      } catch {
        toast.error(
          "Invalid M-Pesa number. Use format 07XX XXX XXX or 254XXXXXXXXX.",
        );
        return;
      }
    }

    try {
      await api.post("/api/v1/payments/initiate", {
        event_id: event.id,
        ticket_type_id: selectedTicketData.id,
        quantity,
        payment_method: selectedTicketData.is_free ? "FREE" : "MPESA",
        ...(selectedTicketData.is_free ? {} : { phone_number: formattedPhone }),
      });

      setCheckoutStep("success");
    } catch (err) {
      setCheckoutStep("payment");
      if (err instanceof APIError) {
        if (err.code === "INSUFFICIENT_TICKETS") {
          toast.error(
            "Not enough tickets available for your selected quantity.",
          );
          return;
        }
        toast.error(err.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleReset = () => {
    setSelectedTicket(null);
    setQuantity(1);
    setPhone("");
    setCheckoutStep("idle");
  };

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-24 space-y-4">
        {checkoutStep === "success" ? (
          // success state
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-black text-base">
                {selectedTicketData?.is_free
                  ? "Ticket reserved!"
                  : "Payment initiated!"}
              </p>
              <p className="text-white/40 text-xs mt-1 leading-relaxed">
                {selectedTicketData?.is_free
                  ? "Check your email for your ticket confirmation."
                  : "Check your phone for the M-Pesa prompt and complete the payment."}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-white/30 hover:text-white/60 text-xs font-semibold transition-colors">
              Back to tickets
            </button>
          </div>
        ) : checkoutStep === "payment" || checkoutStep === "processing" ? (
          // checkout form
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4" style={{ color: accent }} />
                <h2 className="text-white font-black text-lg tracking-tight">
                  Checkout
                </h2>
              </div>
              <button
                onClick={() => setCheckoutStep("idle")}
                disabled={checkoutStep === "processing"}
                className="text-white/25 hover:text-white/60 transition-colors disabled:opacity-25">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* selected ticket summary */}
            <div
              className="rounded-xl border p-4 space-y-1"
              style={{
                borderColor: `${accent}30`,
                background: `${accent}08`,
              }}>
              <p className="text-white font-bold text-sm">
                {selectedTicketData?.name}
              </p>
              <p className="text-white/40 text-xs">
                {selectedTicketData?.is_free
                  ? "Free"
                  : formatPrice(
                      selectedTicketData?.price ?? 0,
                      selectedTicketData?.currency ?? "KES",
                    )}{" "}
                per ticket
              </p>
            </div>

            {/* quantity */}
            <div className="space-y-2">
              <p className="text-white/60 text-xs font-black uppercase tracking-widest">
                Quantity
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || checkoutStep === "processing"}
                  className="w-9 h-9 rounded-lg border border-white/8 bg-white/4 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-white font-black text-lg w-8 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  disabled={quantity >= 10 || checkoutStep === "processing"}
                  className="w-9 h-9 rounded-lg border border-white/8 bg-white/4 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* mpesa phone — paid tickets only */}
            {!selectedTicketData?.is_free && (
              <div className="space-y-2">
                <p className="text-white/60 text-xs font-black uppercase tracking-widest">
                  M-Pesa Number
                </p>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XX XXX XXX"
                    disabled={checkoutStep === "processing"}
                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/6 transition-all duration-200 disabled:opacity-50"
                  />
                </div>
                <p className="text-white/20 text-xs">
                  You&apos;ll receive an M-Pesa prompt on this number.
                </p>
              </div>
            )}

            {/* total — paid only */}
            {!selectedTicketData?.is_free && (
              <div className="flex items-center justify-between py-3 border-t border-white/6">
                <span className="text-white/40 text-sm">Total</span>
                <span className="text-white font-black text-base">
                  {formatPrice(
                    totalPrice,
                    selectedTicketData?.currency ?? "KES",
                  )}
                </span>
              </div>
            )}

            {/* pay button */}
            <button
              onClick={handlePayment}
              disabled={checkoutStep === "processing"}
              className="w-full h-12 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {checkoutStep === "processing" ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  {selectedTicketData?.is_free
                    ? "Reserving…"
                    : "Sending prompt…"}
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4" />
                  {selectedTicketData?.is_free
                    ? "Confirm reservation"
                    : `Pay ${formatPrice(totalPrice, selectedTicketData?.currency ?? "KES")}`}
                </>
              )}
            </button>
          </div>
        ) : (
          // idle — ticket selection
          <>
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="w-4 h-4" style={{ color: accent }} />
              <h2 className="text-white font-black text-lg tracking-tight">
                Tickets
              </h2>
            </div>

            {tickets.length === 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white/2 p-6 text-center">
                <p className="text-white/25 text-sm">No tickets available.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    accent={accent}
                    selected={selectedTicket === ticket.id}
                    onSelect={() => handleTicketSelect(ticket.id)}
                  />
                ))}
              </div>
            )}

            <div className="pt-2">
              {selectedTicketData ? (
                <button
                  onClick={handleBuyClick}
                  className="w-full h-12 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/25 transition-all duration-200 flex items-center justify-center gap-2">
                  {isAuthenticated ? (
                    <>
                      <Ticket className="w-4 h-4" />
                      {selectedTicketData.is_free
                        ? "Reserve free ticket"
                        : `Buy for ${formatPrice(selectedTicketData.price, selectedTicketData.currency)}`}
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign in to buy
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full h-12 rounded-xl font-bold text-sm text-white/20 bg-white/4 border border-white/8 cursor-not-allowed flex items-center justify-center gap-2">
                  <Ticket className="w-4 h-4" />
                  Select a ticket type
                </button>
              )}
            </div>

            <p className="text-white/20 text-xs text-center">
              Secure checkout · Instant confirmation
            </p>

            <div className="h-px bg-white/6" />

            {/* event at a glance */}
            <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-4">
              <h3 className="text-white/60 text-xs font-black uppercase tracking-widest">
                Event details
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarDays className="w-3.5 h-3.5 text-white/25 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/70 text-xs font-semibold">Date</p>
                    <p className="text-white/35 text-xs mt-0.5">
                      {formatDateLong(event.starts_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-3.5 h-3.5 text-white/25 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/70 text-xs font-semibold">Time</p>
                    <p className="text-white/35 text-xs mt-0.5">
                      {formatTime(event.starts_at)} –{" "}
                      {formatTime(event.ends_at)}
                    </p>
                  </div>
                </div>
                {!event.is_online && (event.venue || event.location) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-3.5 h-3.5 text-white/25 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/70 text-xs font-semibold">
                        Location
                      </p>
                      <p className="text-white/35 text-xs mt-0.5">
                        {event.venue && (
                          <span className="block">{event.venue}</span>
                        )}
                        {event.location && (
                          <span className="block">{event.location}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {event.is_online && (
                  <div className="flex items-start gap-3">
                    <Wifi className="w-3.5 h-3.5 text-white/25 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/70 text-xs font-semibold">
                        Format
                      </p>
                      <p className="text-white/35 text-xs mt-0.5">
                        Online event
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
