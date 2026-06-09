"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Type,
  AlignLeft,
  MapPin,
  Building2,
  CalendarDays,
  Clock,
  Wifi,
  Link as LinkIcon,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { api, APIError } from "@/lib/api";

// Schema — mirrors CreateEventInput exactly
const createEventSchema = z
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
  .refine((d) => new Date(d.starts_at) > new Date(), {
    message: "Start date must be in the future",
    path: ["starts_at"],
  })
  .refine((d) => !d.is_online || (d.online_url && d.online_url.length > 0), {
    message: "Online URL is required for online events",
    path: ["online_url"],
  });

type CreateEventForm = z.infer<typeof createEventSchema>;

// Input field wrapper
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

// Section card
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
      {/* left — section label */}
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

      {/* right — fields */}
      <div className="rounded-2xl border border-white/8 bg-white/2 p-6 space-y-5">
        {children}
      </div>
    </div>
  );
}

// Styled input
const inputClass =
  "w-full h-12 rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/6 focus:ring-2 focus:ring-orange-500/8 transition-all duration-200 px-4";

const textareaClass =
  "w-full rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/6 focus:ring-2 focus:ring-orange-500/8 transition-all duration-200 px-4 py-3 resize-none leading-relaxed";

// New event page
export default function NewEventPage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  const form = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      venue: "",
      starts_at: "",
      ends_at: "",
      is_online: false,
      online_url: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (data: CreateEventForm) => {
    try {
      const res = await api.post("/api/v1/events", {
        title: data.title,
        description: data.description ?? "",
        location: data.location ?? "",
        venue: data.venue ?? "",
        starts_at: new Date(data.starts_at).toISOString(),
        ends_at: new Date(data.ends_at).toISOString(),
        is_online: data.is_online,
        online_url: data.online_url ?? "",
      });

      const json = await res.json();
      const eventId = json.data.id;

      toast.success("Event created! Now add your ticket types.");
      router.push(`/dashboard/organiser/events/${eventId}/setup`);
    } catch (err) {
      if (err instanceof APIError) {
        if (err.code === "VALIDATION_ERROR") {
          toast.error(err.message);
          return;
        }
        toast.error(err.message);
        return;
      }
      toast.error("Something went wrong. Please try again.");
    }
  };

  const watchTitle = form.watch("title");

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
            <Sparkles className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
              Step 1 of 2
            </p>
            <h1 className="text-white font-black text-3xl tracking-tight leading-tight">
              {watchTitle.trim() ? watchTitle : "Create an event"}
            </h1>
            <p className="text-white/30 text-sm mt-1">
              Fill in the details. Ticket types come next.
            </p>
          </div>
        </div>
      </div>

      {/* progress indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-black">1</span>
          </div>
          <span className="text-white text-xs font-bold">Event details</span>
        </div>
        <div className="flex-1 h-px bg-white/10 max-w-12" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
            <span className="text-white/30 text-[10px] font-black">2</span>
          </div>
          <span className="text-white/30 text-xs font-bold">Ticket types</span>
        </div>
      </div>

      {/* form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* basics */}
        <FormSection
          number="01"
          title="Basics"
          description="What's the event called and what can attendees expect?">
          <div className="space-y-5">
            {/* title */}
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

            {/* description */}
            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormField
                  icon={AlignLeft}
                  label="Description"
                  hint="Optional — tell attendees what to expect.">
                  <textarea
                    {...field}
                    rows={4}
                    placeholder="Describe your event…"
                    className={textareaClass}
                  />
                </FormField>
              )}
            />
          </div>
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
                    className={`${inputClass} [color-scheme:dark] ${fieldState.invalid ? "border-red-500/40" : ""}`}
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
                    className={`${inputClass} [color-scheme:dark] ${fieldState.invalid ? "border-red-500/40" : ""}`}
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
          description="Where is your event taking place? Skip if online.">
          {/* online toggle */}
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
                {/* toggle pill */}
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

          {/* physical location fields */}
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

          {/* online URL */}
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
        <div className="flex items-center justify-between pt-2 border-t border-white/6">
          <p className="text-white/20 text-xs">
            Event will be saved as a{" "}
            <span className="text-white/40 font-semibold">Draft</span> — you can
            publish after adding tickets.
          </p>
          <button
            type="submit"
            disabled={isLoading}
            className="h-11 px-6 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shrink-0">
            {isLoading ? (
              <>
                <LoaderCircle className="w-4 h-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
