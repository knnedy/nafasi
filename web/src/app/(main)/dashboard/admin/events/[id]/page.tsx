"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Circle,
  CalendarDays,
  MapPin,
  Wifi,
  User,
  Hash,
  Clock,
  AlertTriangle,
  LoaderCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { APIError } from "@/lib/api";
import {
  useAdminEvent,
  useCancelEvent,
  useDeleteEvent,
} from "@/hooks/admin/use-events";

// Helpers
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusConfig(status: string) {
  switch (status) {
    case "PUBLISHED":
      return {
        label: "Published",
        cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        icon: CheckCircle,
      };
    case "DRAFT":
      return {
        label: "Draft",
        cls: "bg-white/6 border-white/10 text-white/40",
        icon: Circle,
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        cls: "bg-red-500/10 border-red-500/20 text-red-400",
        icon: XCircle,
      };
    case "COMPLETED":
      return {
        label: "Completed",
        cls: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        icon: CheckCircle,
      };
    default:
      return {
        label: status,
        cls: "bg-white/6 border-white/10 text-white/40",
        icon: Circle,
      };
  }
}

// Confirm dialog
function ConfirmAction({
  title,
  description,
  confirmLabel,
  confirmCls,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmCls: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/4 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-bold text-sm">{title}</p>
          <p className="text-white/40 text-xs mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="h-9 px-4 rounded-lg text-white/40 hover:text-white/70 text-xs font-bold transition-colors disabled:opacity-40">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`h-9 px-4 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-40 ${confirmCls}`}>
          {loading && <LoaderCircle className="w-3.5 h-3.5 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

function ActionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-4">
      {children}
    </div>
  );
}

function errorMessage(err: unknown) {
  if (err instanceof APIError) return err.message;
  return "Something went wrong. Please try again.";
}

// Page
export default function AdminEventDetailPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const router = useRouter();

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { data: event, isLoading } = useAdminEvent(eventId);
  const cancelMutation = useCancelEvent(eventId);
  const deleteMutation = useDeleteEvent(eventId);

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync();
      setConfirmingCancel(false);
      toast.success("Event cancelled.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync();
      toast.success("Event deleted.");
      router.push("/dashboard/admin/events");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (isLoading || !event) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-white/30 text-sm font-semibold">Loading...</p>
      </div>
    );
  }

  const sc = statusConfig(event.status);
  const StatusIcon = sc.icon;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* back */}
      <div>
        <Link
          href="/dashboard/admin/events"
          className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-sm font-semibold transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          All events
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
              Event
            </p>
            <h1 className="text-white font-black text-3xl tracking-tight leading-tight">
              {event.title}
            </h1>
          </div>
          <Link
            href={`/events/${event.slug}`}
            target="_blank"
            className="shrink-0 inline-flex items-center gap-1.5 text-white/25 hover:text-white/50 text-xs font-bold transition-colors mt-1">
            Public page
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* detail card */}
      <div className="rounded-2xl border border-white/8 bg-white/2 p-6 space-y-5">
        {/* status */}
        <span
          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${sc.cls}`}>
          <StatusIcon className="w-2.5 h-2.5" />
          {sc.label}
        </span>

        {/* description */}
        {event.description && (
          <p className="text-white/40 text-sm leading-relaxed">
            {event.description}
          </p>
        )}

        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-3.5 h-3.5 text-white/20 shrink-0" />
            <p className="text-white/60 text-sm">
              {formatDate(event.starts_at)}{" "}
              <span className="text-white/30">
                · {formatTime(event.starts_at)} – {formatTime(event.ends_at)}
              </span>
            </p>
          </div>

          {event.is_online ? (
            <div className="flex items-center gap-3">
              <Wifi className="w-3.5 h-3.5 text-white/20 shrink-0" />
              <p className="text-white/60 text-sm">
                Online event
                {event.online_url && (
                  <span className="text-white/30 ml-1.5 font-mono text-xs">
                    · {event.online_url}
                  </span>
                )}
              </p>
            </div>
          ) : (
            (event.venue || event.location) && (
              <div className="flex items-center gap-3">
                <MapPin className="w-3.5 h-3.5 text-white/20 shrink-0" />
                <p className="text-white/60 text-sm">
                  {event.venue}
                  {event.venue && event.location && (
                    <span className="text-white/30"> · {event.location}</span>
                  )}
                  {!event.venue && event.location}
                </p>
              </div>
            )
          )}

          <div className="flex items-center gap-3">
            <User className="w-3.5 h-3.5 text-white/20 shrink-0" />
            <Link
              href={`/dashboard/admin/users/${event.organiser_id}`}
              className="text-white/60 text-sm hover:text-orange-400 transition-colors">
              {event.organiser_name}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Hash className="w-3.5 h-3.5 text-white/20 shrink-0" />
            <p className="text-white/25 text-xs font-mono">{event.id}</p>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-3.5 h-3.5 text-white/20 shrink-0" />
            <p className="text-white/25 text-xs">
              Created {formatDate(event.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="space-y-4">
        <h2 className="text-white font-black text-base tracking-tight">
          Actions
        </h2>

        {/* cancel — only for non-cancelled, non-completed events */}
        {event.status !== "CANCELLED" && event.status !== "COMPLETED" && (
          <div className="space-y-3">
            {confirmingCancel ? (
              <ConfirmAction
                title="Cancel this event?"
                description="This will mark the event as cancelled. Attendees with existing orders will be affected. This action cannot be undone."
                confirmLabel="Cancel event"
                confirmCls="bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/20"
                onConfirm={handleCancel}
                onCancel={() => setConfirmingCancel(false)}
                loading={cancelMutation.isPending}
              />
            ) : (
              <ActionCard>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white font-bold text-sm">Cancel Event</p>
                    <p className="text-white/30 text-xs mt-1 leading-relaxed">
                      Mark this event as cancelled. Attendees with existing
                      orders will be affected.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmingCancel(true)}
                    className="shrink-0 h-9 px-4 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400/60 hover:text-red-400 hover:bg-red-500/15 text-xs font-bold transition-all duration-200">
                    Cancel event
                  </button>
                </div>
              </ActionCard>
            )}
          </div>
        )}

        {/* delete */}
        <div className="space-y-3">
          {confirmingDelete ? (
            <ConfirmAction
              title="Delete this event?"
              description="This permanently removes the event and all associated ticket types. Orders linked to this event will also be affected. This cannot be undone."
              confirmLabel="Delete event"
              confirmCls="bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/20"
              onConfirm={handleDelete}
              onCancel={() => setConfirmingDelete(false)}
              loading={deleteMutation.isPending}
            />
          ) : (
            <ActionCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white font-bold text-sm">Delete Event</p>
                  <p className="text-white/30 text-xs mt-1 leading-relaxed">
                    Permanently delete this event and all its data. This cannot
                    be undone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="shrink-0 h-9 px-4 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400/60 hover:text-red-400 hover:bg-red-500/15 text-xs font-bold transition-all duration-200">
                  Delete
                </button>
              </div>
            </ActionCard>
          )}
        </div>
      </div>
    </div>
  );
}
