"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  Type,
  AlignLeft,
  MapPin,
  Building2,
  CalendarDays,
  Clock,
  Wifi,
  Link as LinkIcon,
  LoaderCircle,
  CheckCircle,
  Circle,
  XCircle,
  Flag,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { api, APIError } from "@/lib/api";

const editEventSchema = z
  .object({
    title: z
      .string()
      .min(3, { message: "Title must be at least 3 characters" })
      .max(255, { message: "Title must be under 255 characters" }),
    description: z.string().optional(),
    location: z.string().optional(),
    venue: z.string().optional(),
    starts_at: z.string().min(1, { message: "Start date is required" }),
    ends_at: z.string().min(1, { message: "End date is required" }),
    is_online: z.boolean(),
    online_url: z
      .string()
      .optional()
      .refine((v) => !v || v.startsWith("http"), {
        message: "Must be a valid URL",
      }),
  })
  .refine((d) => new Date(d.ends_at) > new Date(d.starts_at), {
    message: "End date must be after start date",
    path: ["ends_at"],
  })
  .refine((d) => !d.is_online || (d.online_url && d.online_url.length > 0), {
    message: "Online URL is required for online events",
    path: ["online_url"],
  });

type EditEventForm = z.infer<typeof editEventSchema>;

const MOCK_EVENT = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  title: "Afropunk Nairobi 2026",
  description:
    "The biggest Afropunk festival hits Nairobi with a lineup of world-class artists celebrating African culture, music, and identity.",
  location: "Nairobi, Kenya",
  venue: "Uhuru Gardens",
  starts_at: "2026-06-14T18:00",
  ends_at: "2026-06-14T23:00",
  is_online: false,
  online_url: "",
  status: "PUBLISHED",
};

const STATUS_OPTIONS = [
  {
    value: "DRAFT",
    label: "Draft",
    description: "Not visible to the public",
    icon: Circle,
    cls: "border-white/10 text-white/40",
    activeCls: "bg-white/6 border-white/20 text-white",
  },
  {
    value: "PUBLISHED",
    label: "Published",
    description: "Live and accepting orders",
    icon: CheckCircle,
    cls: "border-emerald-500/15 text-emerald-400/40",
    activeCls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
    description: "Event will not take place",
    icon: XCircle,
    cls: "border-red-500/15 text-red-400/40",
    activeCls: "bg-red-500/10 border-red-500/30 text-red-400",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    description: "Event has ended",
    icon: Flag,
    cls: "border-blue-500/15 text-blue-400/40",
    activeCls: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  },
] as const;

// ─── shared components ───────────────────────────────────────────────────────

function FormField({
  icon: Icon,
  label,
  error,
  hint,
  children,
}: {
  icon: React.ElementType;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
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

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 lg:gap-12">
      <div className="lg:pt-1">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center shrink-0">
            <span className="text-orange-400 text-[10px] font-black">
              {number}
            </span>
          </div>
          <h3 className="text-white font-black text-sm tracking-tight">
            {title}
          </h3>
        </div>
        <p className="text-white/25 text-xs leading-relaxed">{description}</p>
      </div>
      <div className="rounded-2xl border border-white/8 bg-white/2 p-6 space-y-5">
        {children}
      </div>
    </div>
  );
}

const inputClass =
  "w-full h-12 rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/6 focus:ring-2 focus:ring-orange-500/8 transition-all duration-200 px-4";

const textareaClass =
  "w-full rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/6 focus:ring-2 focus:ring-orange-500/8 transition-all duration-200 px-4 py-3 resize-none leading-relaxed";

export default function EditEventPage() {
  const router = useRouter();
  const event = MOCK_EVENT;

  const [isOnline, setIsOnline] = useState(event.is_online);
  const [currentStatus, setCurrentStatus] = useState(event.status);
  const [statusLoading, setStatusLoading] = useState(false);

  const form = useForm<EditEventForm>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      title: event.title,
      description: event.description,
      location: event.location,
      venue: event.venue,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      is_online: event.is_online,
      online_url: event.online_url,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (data: EditEventForm) => {
    try {
      await api.patch(`/api/v1/events/${event.id}`, {
        title: data.title,
        description: data.description ?? "",
        location: data.location ?? "",
        venue: data.venue ?? "",
        starts_at: new Date(data.starts_at).toISOString(),
        ends_at: new Date(data.ends_at).toISOString(),
        is_online: data.is_online,
        online_url: data.online_url ?? "",
      });

      toast.success("Event updated.");
    } catch (err) {
      if (err instanceof APIError) {
        toast.error(err.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleStatusChange = async (status: string) => {
    if (status === currentStatus) return;
    setStatusLoading(true);
    try {
      await api.patch(`/api/v1/events/${event.id}/status`, { status });
      setCurrentStatus(status);
      toast.success(`Event marked as ${status.toLowerCase()}.`);
    } catch (err) {
      if (err instanceof APIError) {
        toast.error(err.message);
        return;
      }
      toast.error("Failed to update status.");
    } finally {
      setStatusLoading(false);
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
        <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
          Edit event
        </p>
        <h1 className="text-white font-black text-3xl tracking-tight leading-tight">
          {event.title}
        </h1>
        <p className="text-white/30 text-sm mt-1">
          Changes save immediately on submit.
        </p>
      </div>

      {/* status */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 lg:gap-12">
        <div className="lg:pt-1">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500/15 border border-orange-500/25 flex items-center justify-center shrink-0">
              <span className="text-orange-400 text-[10px] font-black">00</span>
            </div>
            <h3 className="text-white font-black text-sm tracking-tight">
              Status
            </h3>
          </div>
          <p className="text-white/25 text-xs leading-relaxed">
            Controls visibility and whether the event accepts orders.
          </p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/2 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STATUS_OPTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = currentStatus === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s.value)}
                  disabled={statusLoading}
                  className={`flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isActive
                      ? s.activeCls
                      : `bg-white/2 hover:bg-white/4 ${s.cls}`
                  }`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-xs font-black leading-tight">
                      {s.label}
                    </p>
                    <p className="text-[10px] text-white/25 mt-0.5 leading-tight">
                      {s.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* basics */}
        <FormSection
          number="01"
          title="Basics"
          description="The event title and description attendees will see.">
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormField
                icon={Type}
                label="Event title"
                error={fieldState.error?.message}>
                <input
                  {...field}
                  placeholder="e.g. Afropunk Nairobi 2026"
                  className={`${inputClass} ${fieldState.invalid ? "border-red-500/40" : ""}`}
                />
              </FormField>
            )}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field }) => (
              <FormField icon={AlignLeft} label="Description" hint="Optional">
                <textarea
                  {...field}
                  rows={4}
                  placeholder="Describe your event…"
                  className={textareaClass}
                />
              </FormField>
            )}
          />
        </FormSection>

        {/* date & time */}
        <FormSection
          number="02"
          title="Date & Time"
          description="When does your event start and end?">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Controller
              name="starts_at"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormField
                  icon={CalendarDays}
                  label="Starts at"
                  error={fieldState.error?.message}>
                  <input
                    {...field}
                    type="datetime-local"
                    className={`${inputClass} scheme-dark ${fieldState.invalid ? "border-red-500/40" : ""}`}
                  />
                </FormField>
              )}
            />
            <Controller
              name="ends_at"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormField
                  icon={Clock}
                  label="Ends at"
                  error={fieldState.error?.message}>
                  <input
                    {...field}
                    type="datetime-local"
                    className={`${inputClass} scheme-dark ${fieldState.invalid ? "border-red-500/40" : ""}`}
                  />
                </FormField>
              )}
            />
          </div>
        </FormSection>

        {/* location */}
        <FormSection
          number="03"
          title="Location"
          description="Where is your event taking place?">
          <Controller
            name="is_online"
            control={form.control}
            render={({ field }) => (
              <button
                type="button"
                onClick={() => {
                  const next = !field.value;
                  field.onChange(next);
                  setIsOnline(next);
                }}
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
                    <Wifi
                      className={`w-4 h-4 ${field.value ? "text-emerald-400" : "text-white/25"}`}
                    />
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-sm font-bold ${field.value ? "text-emerald-400" : "text-white/60"}`}>
                      Online event
                    </p>
                    <p className="text-white/25 text-xs mt-0.5">
                      {field.value
                        ? "Virtual — attendees join online"
                        : "Toggle if this is a virtual event"}
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

          {!isOnline && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Controller
                name="venue"
                control={form.control}
                render={({ field }) => (
                  <FormField
                    icon={Building2}
                    label="Venue"
                    hint="e.g. Uhuru Gardens">
                    <input
                      {...field}
                      placeholder="Venue name"
                      className={inputClass}
                    />
                  </FormField>
                )}
              />
              <Controller
                name="location"
                control={form.control}
                render={({ field }) => (
                  <FormField
                    icon={MapPin}
                    label="Location"
                    hint="e.g. Nairobi, Kenya">
                    <input
                      {...field}
                      placeholder="City or address"
                      className={inputClass}
                    />
                  </FormField>
                )}
              />
            </div>
          )}

          {isOnline && (
            <Controller
              name="online_url"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormField
                  icon={LinkIcon}
                  label="Online URL"
                  error={fieldState.error?.message}
                  hint="Link attendees will use to join">
                  <input
                    {...field}
                    type="url"
                    placeholder="https://meet.example.com/your-event"
                    className={`${inputClass} ${fieldState.invalid ? "border-red-500/40" : ""}`}
                  />
                </FormField>
              )}
            />
          )}
        </FormSection>

        {/* submit */}
        <div className="flex items-center justify-end pt-2 border-t border-white/6">
          <button
            type="submit"
            disabled={isLoading}
            className="h-11 px-6 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {isLoading ? (
              <>
                <LoaderCircle className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
