"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEventBySlug, useEventTicketTypes } from "@/hooks/use-events";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Wifi,
  Clock,
  ExternalLink,
  Share2,
  CheckCircle,
} from "lucide-react";
import {
  accentForId,
  formatDateLong,
  formatDuration,
  formatTime,
} from "@/lib/utils";
import TicketSidebar from "./components/ticket-sidebar";
import EmptyState from "../../components/empty-state";

export default function EventPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const {
    data: event,
    isLoading: isLoadingEvent,
    error,
  } = useEventBySlug(slug);

  const { data: tickets = [], isLoading: isLoadingTickets } =
    useEventTicketTypes(event?.id);

  const [copied, setCopied] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [bannerDims, setBannerDims] = useState({ width: 1200, height: 675 });

  if (isLoadingEvent) {
    return (
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 animate-pulse">
        <div className="w-32 h-4 bg-white/10 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="w-full aspect-video bg-white/5 rounded-2xl" />
            <div className="space-y-4">
              <div className="w-3/4 h-10 bg-white/10 rounded" />
              <div className="w-1/2 h-4 bg-white/5 rounded" />
              <div className="w-1/2 h-4 bg-white/5 rounded" />
            </div>
          </div>
          <div className="h-96 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <EmptyState
          title="Event not found"
          message="This event may have been removed or the URL is incorrect."
        />
        <div className="mt-8 flex justify-center">
          <Link
            href="/events"
            className="px-6 py-3 rounded-xl font-bold text-sm text-white/55 hover:text-white bg-white/4 border border-white/8 hover:bg-white/[0.07] transition-all duration-200">
            Browse all events
          </Link>
        </div>
      </div>
    );
  }

  const accent = accentForId(event.id);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
      {/* back link */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-white/30 hover:text-white/70 text-sm font-semibold transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Back to events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* left — event details */}
        <div className="lg:col-span-2 space-y-8">
          {/* banner */}
          <div className="w-full">
            {event.banner_url ? (
              <div
                ref={bannerRef}
                className="relative rounded-2xl overflow-hidden bg-[#0e0c0a] max-w-full"
                style={
                  bannerDims
                    ? {
                        width: bannerDims.width,
                        maxWidth: "100%",
                        aspectRatio: `${bannerDims.width} / ${bannerDims.height}`,
                        maxHeight: 520,
                      }
                    : { width: "100%", aspectRatio: "16/9" }
                }>
                <Image
                  src={event.banner_url}
                  alt={event.title}
                  width={bannerDims.width}
                  height={bannerDims.height}
                  className="w-full h-auto max-h-130 object-contain rounded-2xl"
                  priority
                  onLoad={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.naturalWidth > 0) {
                      setBannerDims({
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                      });
                    }
                  }}
                  unoptimized
                />
                <div
                  className="absolute top-0 left-0 right-0 h-0.75"
                  style={{ background: accent }}
                />
                <div className="absolute top-4 left-4">
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full"
                    style={{
                      color: accent,
                      background: `${accent}18`,
                      border: `1px solid ${accent}30`,
                    }}>
                    {event.status}
                  </span>
                </div>
                <button
                  onClick={handleShare}
                  className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-white/70 hover:text-white text-xs font-semibold transition-colors z-10">
                  {copied ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="relative w-full rounded-2xl overflow-hidden bg-[#0e0c0a] aspect-video">
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    background: `radial-gradient(ellipse at 25% 60%, ${accent} 0%, transparent 65%)`,
                  }}
                />
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(ellipse at 80% 20%, ${accent} 0%, transparent 55%)`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <span className="text-[8rem] font-black uppercase tracking-tighter leading-none select-none opacity-[0.03] text-white text-center px-8">
                    {event.title}
                  </span>
                </div>
                <div
                  className="absolute top-0 left-0 right-0 h-0.75"
                  style={{ background: accent }}
                />
                <div className="absolute top-4 left-4">
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full"
                    style={{
                      color: accent,
                      background: `${accent}18`,
                      border: `1px solid ${accent}30`,
                    }}>
                    {event.status}
                  </span>
                </div>
                <button
                  onClick={handleShare}
                  className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-white/70 hover:text-white text-xs font-semibold transition-colors z-10">
                  {copied ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* title + meta */}
          <div className="space-y-4">
            <h1 className="text-white font-black text-3xl sm:text-4xl tracking-tight leading-tight">
              {event.title}
            </h1>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <CalendarDays
                  className="w-4 h-4 shrink-0"
                  style={{ color: accent }}
                />
                <span>{formatDateLong(event.starts_at)}</span>
              </div>
              <div className="flex items-center gap-3 text-white/50 text-sm">
                <Clock className="w-4 h-4 shrink-0" style={{ color: accent }} />
                <span>
                  {formatTime(event.starts_at)} – {formatTime(event.ends_at)}{" "}
                  <span className="text-white/25">
                    ({formatDuration(event.starts_at, event.ends_at)})
                  </span>
                </span>
              </div>
              {event.is_online ? (
                <div className="flex items-center gap-3 text-emerald-500/80 text-sm">
                  <Wifi className="w-4 h-4 shrink-0" />
                  <span>Online event</span>
                  {event.online_url && (
                    <a
                      href={event.online_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
                      Join link
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : (
                (event.venue || event.location) && (
                  <div className="flex items-center gap-3 text-white/50 text-sm">
                    <MapPin
                      className="w-4 h-4 shrink-0"
                      style={{ color: accent }}
                    />
                    <span>
                      {event.venue}
                      {event.venue && event.location && (
                        <span className="text-white/25">
                          {" "}
                          · {event.location}
                        </span>
                      )}
                      {!event.venue && event.location}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* divider */}
          <div className="h-px bg-white/6" />

          {/* description */}
          {event.description && (
            <div className="space-y-3">
              <h2 className="text-white font-black text-lg tracking-tight">
                About this event
              </h2>
              <div className="space-y-4">
                {event.description.split("\n\n").map((para, i) => (
                  <p key={i} className="text-white/50 text-sm leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* right — ticket sidebar */}
        {/* Pass isLoadingTickets down if you want to handle skeleton loading in the sidebar itself */}
        <TicketSidebar
          accent={accent}
          event={event}
          tickets={tickets}
          isLoading={isLoadingTickets}
        />
      </div>
    </div>
  );
}
