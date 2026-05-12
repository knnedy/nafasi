"use client";

import { useMemo, useState } from "react";
import { MOCK_CATEGORIES, MOCK_UPCOMING } from "@/app/(main)/mock_events";
import { accentForId, categoryName, formatTime } from "@/app/(main)/utils";
import { EventResponse } from "@/app/(main)/mock_events";
import EmptyState from "../components/empty-state";
import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, Wifi } from "lucide-react";

// Group events by month label e.g. "August 2026"
function groupByMonth(
  events: EventResponse[],
): Record<string, EventResponse[]> {
  return events.reduce<Record<string, EventResponse[]>>((acc, event) => {
    const label = new Date(event.starts_at).toLocaleDateString("en-KE", {
      month: "long",
      year: "numeric",
    });
    if (!acc[label]) acc[label] = [];
    acc[label].push(event);
    return acc;
  }, {});
}

function formatDayFull(iso: string) {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString("en-KE", { weekday: "long" }),
    day: d.getDate(),
    month: d.toLocaleDateString("en-KE", { month: "short" }).toUpperCase(),
  };
}

// Single upcoming event row in the timeline
function TimelineRow({ event }: { event: EventResponse }) {
  const accent = accentForId(event.id);
  const cat = categoryName(event.category_id);
  const { weekday, day, month } = formatDayFull(event.starts_at);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex gap-6 py-6 border-b border-white/5 last:border-0 hover:bg-white/1.5 -mx-6 px-6 transition-all duration-300 rounded-xl">
      {/* date column */}
      <div className="shrink-0 w-16 text-right">
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">
          {weekday.slice(0, 3)}
        </p>
        <p
          className="text-white font-black text-3xl leading-none tracking-tight"
          style={{ color: accent }}>
          {day}
        </p>
        <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-0.5">
          {month}
        </p>
      </div>

      {/* vertical line + dot */}
      <div className="relative flex flex-col items-center shrink-0 pt-1">
        <div
          className="w-2.5 h-2.5 rounded-full border-2 mt-1 shrink-0 transition-all duration-300 group-hover:scale-125"
          style={{ borderColor: accent, background: `${accent}30` }}
        />
        <div
          className="w-px flex-1 mt-2"
          style={{ background: `${accent}20` }}
        />
      </div>

      {/* content */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {cat && (
              <span
                className="text-[10px] font-black uppercase tracking-[0.15em] mb-2 block"
                style={{ color: `${accent}99` }}>
                {cat}
              </span>
            )}
            <h3 className="text-white font-black text-lg leading-tight tracking-tight group-hover:text-orange-50 transition-colors line-clamp-1">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-white/25 text-xs leading-relaxed mt-1.5 line-clamp-2 max-w-xl">
                {event.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="text-white/30 text-xs flex items-center gap-1.5">
                <CalendarDays
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: accent }}
                />
                {formatTime(event.starts_at)}
              </span>
              {event.is_online ? (
                <span className="text-emerald-500/70 text-xs flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 shrink-0" />
                  Online event
                </span>
              ) : (
                (event.venue || event.location) && (
                  <span className="text-white/30 text-xs flex items-center gap-1.5">
                    <MapPin
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: accent }}
                    />
                    {event.venue || event.location}
                  </span>
                )
              )}
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/40 shrink-0 mt-1 transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// Main page
export default function UpcomingPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (activeCategory === null) return MOCK_UPCOMING;
    return MOCK_UPCOMING.filter((e) => {
      const cat = MOCK_CATEGORIES.find((c) => c.id === e.category_id);
      return cat?.name === activeCategory;
    });
  }, [activeCategory]);

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);
  const months = Object.keys(grouped);

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
      {/* page header */}
      <div className="mb-10">
        <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-2">
          What&apos;s ahead
        </p>
        <h1 className="text-white font-black text-4xl sm:text-5xl tracking-tight leading-tight mb-3">
          Upcoming Events
        </h1>
        <p className="text-white/30 text-sm">
          {filtered.length === MOCK_UPCOMING.length
            ? `${MOCK_UPCOMING.length} events coming up`
            : `${filtered.length} of ${MOCK_UPCOMING.length} events`}
        </p>
      </div>

      {/* category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none mb-10">
        <button
          onClick={() => setActiveCategory(null)}
          className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
            activeCategory === null
              ? "bg-orange-500/15 border border-orange-500/30 text-orange-400"
              : "text-white/35 hover:text-white/60 hover:bg-white/4"
          }`}>
          All
        </button>
        {MOCK_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setActiveCategory(activeCategory === cat.name ? null : cat.name)
            }
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeCategory === cat.name
                ? "bg-orange-500/15 border border-orange-500/30 text-orange-400"
                : "text-white/35 hover:text-white/60 hover:bg-white/4"
            }`}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* timeline */}
      {months.length === 0 ? (
        <EmptyState message="No upcoming events in this category." />
      ) : (
        <div className="space-y-14">
          {months.map((month) => (
            <div key={month}>
              {/* month heading */}
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-white font-black text-xl tracking-tight shrink-0">
                  {month}
                </h2>
                <div className="flex-1 h-px bg-white/6" />
                <span className="text-white/20 text-xs font-bold shrink-0">
                  {grouped[month].length}{" "}
                  {grouped[month].length === 1 ? "event" : "events"}
                </span>
              </div>

              {/* events in this month */}
              <div>
                {grouped[month].map((event) => (
                  <TimelineRow key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
