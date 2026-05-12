import Link from "next/link";
import Image from "next/image";
import { EventResponse } from "../mock_events";
import {
  accentForId,
  categoryName,
  formatDateShort,
  formatTime,
} from "../utils";
import { ArrowUpRight, CalendarDays, MapPin, Wifi } from "lucide-react";

export default function EventCard({
  event,
  index,
}: {
  event: EventResponse;
  index: number;
}) {
  const accent = accentForId(event.id);
  const { day, date, month } = formatDateShort(event.starts_at);
  const cat = categoryName(event.category_id);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden border border-white/[0.07] bg-[#111009] hover:border-white/15 transition-all duration-500"
      style={{ animationDelay: `${index * 80}ms` }}>
      <div className="relative h-52 overflow-hidden">
        {event.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ background: "#0e0c0a" }}
            />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `radial-gradient(ellipse at 20% 60%, ${accent} 0%, transparent 65%)`,
              }}
            />
            <div
              className="absolute inset-0 opacity-15"
              style={{
                background: `radial-gradient(ellipse at 80% 20%, ${accent} 0%, transparent 55%)`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <span className="text-[5rem] font-black uppercase tracking-tighter leading-none select-none opacity-[0.04] text-white text-center px-4 line-clamp-2">
                {event.title}
              </span>
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#111009]" />
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: accent }}
        />

        {/* date badge */}
        <div className="absolute top-4 right-4 flex flex-col items-center bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 min-w-13">
          <span className="text-white/50 text-[9px] font-bold tracking-widest">
            {day}
          </span>
          <span className="text-white font-black text-2xl leading-none">
            {date}
          </span>
          <span className="text-white/50 text-[9px] font-bold tracking-widest">
            {month}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 px-5 pt-4 pb-5 gap-3">
        <div className="flex items-center gap-2">
          {cat && (
            <span
              className="text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full"
              style={{
                color: accent,
                background: `${accent}15`,
                border: `1px solid ${accent}25`,
              }}>
              {cat}
            </span>
          )}
        </div>

        <h3 className="text-white font-black text-lg leading-tight group-hover:text-orange-50 transition-colors line-clamp-2 tracking-tight">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-white/30 text-xs leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-white/6 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-white/40 text-xs">
              <CalendarDays
                className="w-3 h-3 shrink-0"
                style={{ color: accent }}
              />
              <span>{formatTime(event.starts_at)}</span>
            </div>
            {/* online replaces location */}
            {event.is_online ? (
              <div className="flex items-center gap-1.5 text-emerald-500/70 text-xs">
                <Wifi className="w-3 h-3 shrink-0" />
                <span>Online event</span>
              </div>
            ) : (
              (event.venue || event.location) && (
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <MapPin
                    className="w-3 h-3 shrink-0"
                    style={{ color: accent }}
                  />
                  <span className="truncate max-w-40">
                    {event.venue || event.location}
                  </span>
                </div>
              )
            )}
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-all duration-300"
            style={{ background: `${accent}15` }}>
            <ArrowUpRight className="w-3.5 h-3.5" style={{ color: accent }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
