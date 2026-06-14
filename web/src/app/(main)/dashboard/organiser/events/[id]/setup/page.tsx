"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  Plus,
  Ticket,
  LoaderCircle,
  CheckCircle,
  Trash2,
  CalendarDays,
  MapPin,
  Wifi,
  Tag,
  Hash,
  AlignLeft,
  Clock,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { api, APIError } from "@/lib/api";
import { formatPrice } from "@/app/(main)/utils";

// Types
interface EventResponse {
  id: string;
  title: string;
  slug: string;
  starts_at: string;
  ends_at: string;
  venue?: string;
  location?: string;
  is_online: boolean;
  status: string;
}

interface TicketTypeResponse {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  quantity_sold: number;
  is_free: boolean;
  sale_starts?: string;
  sale_ends?: string;
}

// Mock event for design
const MOCK_EVENT: EventResponse = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  title: "Afropunk Nairobi 2026",
  slug: "afropunk-nairobi-2026",
  starts_at: "2026-06-14T18:00:00Z",
  ends_at: "2026-06-14T23:00:00Z",
  venue: "Uhuru Gardens",
  location: "Nairobi, Kenya",
  is_online: false,
  status: "DRAFT",
};

// Schema
const ticketTypeSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters" })
      .max(100),
    description: z.string().optional(),
    is_free: z.boolean(),
    price: z.string().optional(),
    quantity: z
      .number({ error: "Quantity must be a number" })
      .int()
      .min(1, { message: "Minimum 1 ticket" }),
    sale_starts: z.string().optional(),
    sale_ends: z.string().optional(),
  })
  .refine((d) => d.is_free || (d.price && parseFloat(d.price) > 0), {
    message: "Price is required for paid tickets",
    path: ["price"],
  });

type TicketTypeForm = z.infer<typeof ticketTypeSchema>;

// Helpers
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Styled input
const inputClass =
  "w-full h-11 rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/6 focus:ring-2 focus:ring-orange-500/8 transition-all duration-200 px-4";

const inputInvalidClass =
  "w-full h-11 rounded-xl bg-white/4 border border-red-500/40 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-red-500/60 transition-all duration-200 px-4";

// Form field
function FormField({
  icon: Icon,
  label,
  error,
  children,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-white/25" />
        <label className="text-white/50 text-xs font-black uppercase tracking-widest">
          {label}
        </label>
      </div>
      {children}
      {hint && !error && <p className="text-white/20 text-xs pl-5">{hint}</p>}
      {error && <p className="text-red-400 text-xs pl-5">{error}</p>}
    </div>
  );
}

// Ticket type card (already added)
function TicketTypeCard({
  ticket,
  onDelete,
}: {
  ticket: TicketTypeResponse;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-4 p-4 rounded-2xl border border-white/8 bg-white/2 hover:border-white/12 transition-all duration-200">
      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
        <Ticket className="w-4 h-4 text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{ticket.name}</p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-white/40 text-xs">
            {ticket.is_free
              ? "Free"
              : formatPrice(ticket.price, ticket.currency)}
          </span>
          <span className="text-white/25 text-xs">
            {ticket.quantity.toLocaleString()} tickets
          </span>
          {ticket.description && (
            <span className="text-white/20 text-xs truncate max-w-40">
              {ticket.description}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 transition-all duration-200 p-1.5 rounded-lg hover:bg-red-500/8">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// Setup page
export default function EventSetupPage() {
  const router = useRouter();
  const [ticketTypes, setTicketTypes] = useState<TicketTypeResponse[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const event = MOCK_EVENT;

  const form = useForm<TicketTypeForm>({
    resolver: zodResolver(ticketTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      is_free: false,
      price: "",
      quantity: 100,
      sale_starts: "",
      sale_ends: "",
    },
  });

  const isFree = form.watch("is_free");
  const isSubmitting = form.formState.isSubmitting;

  const onAddTicketType = async (data: TicketTypeForm) => {
    try {
      const res = await api.post(`/api/v1/events/${event.id}/ticket-types`, {
        name: data.name,
        description: data.description ?? "",
        price: data.is_free ? "0" : (data.price ?? "0"),
        quantity: data.quantity,
        is_free: data.is_free,
        sale_starts: data.sale_starts ?? "",
        sale_ends: data.sale_ends ?? "",
      });

      const json = await res.json();
      setTicketTypes((prev) => [...prev, json.data]);
      form.reset();
      toast.success(`"${data.name}" added.`);
      setShowForm(false);
    } catch (err) {
      if (err instanceof APIError) {
        toast.error(err.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleDeleteTicketType = (id: string) => {
    setTicketTypes((prev) => prev.filter((t) => t.id !== id));
  };

  const handlePublish = async () => {
    if (ticketTypes.length === 0) {
      toast.error("Add at least one ticket type before publishing.");
      return;
    }

    setIsPublishing(true);
    try {
      await api.patch(`/api/v1/events/${event.id}/status`, {
        status: "PUBLISHED",
      });

      toast.success("Event published successfully!");
      router.push(`/dashboard/organiser/events/${event.id}`);
    } catch (err) {
      if (err instanceof APIError) {
        toast.error(err.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* header */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-sm font-semibold transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <Ticket className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
              Step 2 of 2
            </p>
            <h1 className="text-white font-black text-3xl tracking-tight leading-tight">
              Ticket types
            </h1>
            <p className="text-white/30 text-sm mt-1">
              Add tickets for your event, then publish when ready.
            </p>
          </div>
        </div>
      </div>

      {/* progress indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-white/40 text-xs font-bold line-through">
            Event details
          </span>
        </div>
        <div className="flex-1 h-px bg-orange-500/40 max-w-12" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-black">2</span>
          </div>
          <span className="text-white text-xs font-bold">Ticket types</span>
        </div>
      </div>

      {/* event summary card */}
      <div className="rounded-2xl border border-white/8 bg-white/2 p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center shrink-0">
          <CalendarDays className="w-4 h-4 text-orange-400/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{event.title}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-white/30 text-xs flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
            </span>
            {event.is_online ? (
              <span className="text-emerald-500/60 text-xs flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                Online
              </span>
            ) : (
              (event.venue || event.location) && (
                <span className="text-white/25 text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.venue || event.location}
                </span>
              )
            )}
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/6 border border-white/10 text-white/35 shrink-0">
          Draft
        </span>
      </div>

      {/* added ticket types */}
      {ticketTypes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-black text-base tracking-tight">
              Added ticket types
            </h2>
            <span className="text-white/25 text-xs">
              {ticketTypes.length} {ticketTypes.length === 1 ? "type" : "types"}
            </span>
          </div>
          <div className="space-y-2.5">
            {ticketTypes.map((tt) => (
              <TicketTypeCard
                key={tt.id}
                ticket={tt}
                onDelete={() => handleDeleteTicketType(tt.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* add ticket type */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-black text-base tracking-tight">
            {ticketTypes.length === 0 ? "Add a ticket type" : "Add another"}
          </h2>
          {ticketTypes.length > 0 && !showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-orange-400 hover:text-orange-300 text-xs font-bold transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Add type
            </button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={form.handleSubmit(onAddTicketType)}
            className="rounded-2xl border border-white/8 bg-white/2 p-6 space-y-5">
            {/* name */}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormField
                  icon={Tag}
                  label="Ticket name"
                  error={fieldState.error?.message}>
                  <input
                    {...field}
                    placeholder="e.g. General Admission, VIP, Early Bird"
                    className={
                      fieldState.invalid ? inputInvalidClass : inputClass
                    }
                  />
                </FormField>
              )}
            />

            {/* description */}
            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormField
                  icon={AlignLeft}
                  label="Description"
                  hint="Optional — what does this ticket include?">
                  <input
                    {...field}
                    placeholder="e.g. Priority entry and complimentary drinks"
                    className={inputClass}
                  />
                </FormField>
              )}
            />

            {/* free toggle + price */}
            <div className="space-y-4">
              <Controller
                name="is_free"
                control={form.control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                      field.value
                        ? "bg-emerald-500/8 border-emerald-500/20"
                        : "bg-white/3 border-white/8 hover:bg-white/5"
                    }`}>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          field.value
                            ? "bg-emerald-500/15 border border-emerald-500/20"
                            : "bg-white/6 border border-white/8"
                        }`}>
                        <Tag
                          className={`w-4 h-4 ${field.value ? "text-emerald-400" : "text-white/25"}`}
                        />
                      </div>
                      <div className="text-left">
                        <p
                          className={`text-sm font-bold ${field.value ? "text-emerald-400" : "text-white/60"}`}>
                          Free ticket
                        </p>
                        <p className="text-white/25 text-xs mt-0.5">
                          {field.value
                            ? "No payment required"
                            : "Toggle for free admission"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-10 h-5.5 rounded-full transition-all duration-200 relative ${
                        field.value ? "bg-emerald-500" : "bg-white/10"
                      }`}>
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                          field.value ? "left-5.5" : "left-0.5"
                        }`}
                      />
                    </div>
                  </button>
                )}
              />

              {/* price — shown only for paid */}
              {!isFree && (
                <Controller
                  name="price"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <FormField
                      icon={Tag}
                      label="Price (KES)"
                      error={fieldState.error?.message}
                      hint="Enter price in KES e.g. 2500">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 text-sm font-bold">
                          KES
                        </span>
                        <input
                          {...field}
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="2500"
                          className={`${fieldState.invalid ? inputInvalidClass : inputClass} pl-14`}
                        />
                      </div>
                    </FormField>
                  )}
                />
              )}
            </div>

            {/* quantity */}
            <Controller
              name="quantity"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormField
                  icon={Hash}
                  label="Available tickets"
                  error={fieldState.error?.message}
                  hint="How many tickets are available for this type?">
                  <input
                    {...field}
                    type="number"
                    min="1"
                    placeholder="100"
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                    className={
                      fieldState.invalid ? inputInvalidClass : inputClass
                    }
                  />
                </FormField>
              )}
            />

            {/* sale window */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-white/25" />
                <span className="text-white/50 text-xs font-black uppercase tracking-widest">
                  Sale window
                </span>
                <span className="text-white/20 text-xs">(optional)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="sale_starts"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <p className="text-white/30 text-xs pl-1">Sale starts</p>
                      <input
                        {...field}
                        type="datetime-local"
                        className={`${inputClass} scheme-dark`}
                      />
                    </div>
                  )}
                />
                <Controller
                  name="sale_ends"
                  control={form.control}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <p className="text-white/30 text-xs pl-1">Sale ends</p>
                      <input
                        {...field}
                        type="datetime-local"
                        className={`${inputClass} scheme-dark`}
                      />
                    </div>
                  )}
                />
              </div>
            </div>

            {/* form actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/6">
              {ticketTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    form.reset();
                    setShowForm(false);
                  }}
                  className="text-white/30 hover:text-white/60 text-sm font-semibold transition-colors">
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="ml-auto h-11 px-6 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add ticket type
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* publish section */}
      <div className="border-t border-white/6 pt-6 space-y-4">
        {ticketTypes.length === 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/6 border border-amber-500/15">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-400/80 text-sm leading-relaxed">
              Add at least one ticket type before you can publish your event.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white/60 text-sm font-semibold">
              Ready to go live?
            </p>
            <p className="text-white/25 text-xs mt-0.5">
              Publishing makes your event visible to attendees.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing || ticketTypes.length === 0}
            className="h-11 px-6 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
            {isPublishing ? (
              <>
                <LoaderCircle className="w-4 h-4 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                Publish event
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
