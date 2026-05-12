import Link from "next/link";
import { EventResponse } from "../mock_events";
import {
  accentForId,
  categoryName,
  formatDateShort,
  formatTime,
} from "../utils";
import { ChevronRight, MapPin, Wifi } from "lucide-react";

export default function UpcomingRow({
  event,
  index,
}: {
  event: EventResponse;
  index: number;
}) {
  const accent = accentForId(event.id);
  const { date, month } = formatDateShort(event.starts_at);
  const cat = categoryName(event.category_id);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/6 bg-[#111009] hover:bg-[#161310] hover:border-white/12 transition-all duration-300">
      <span className="text-white/10 font-black text-sm w-5 text-right shrink-0 group-hover:text-white/20 transition-colors">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div
        className="shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center"
        style={{ background: `${accent}12`, border: `1px solid ${accent}20` }}>
        <span
          className="font-black text-base leading-none"
          style={{ color: accent }}>
          {date}
        </span>
        <span
          className="text-[9px] font-bold tracking-widest"
          style={{ color: `${accent}99` }}>
          {month}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-sm font-bold truncate leading-tight group-hover:text-white transition-colors tracking-tight">
          {event.title}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {cat && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: `${accent}99` }}>
              {cat}
            </span>
          )}
          {event.is_online ? (
            <span className="text-emerald-500/70 text-[10px] flex items-center gap-1">
              <Wifi className="w-2.5 h-2.5" />
              Online
            </span>
          ) : (
            (event.venue || event.location) && (
              <span className="text-white/25 text-[10px] flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                <span className="truncate max-w-28">
                  {event.venue || event.location}
                </span>
              </span>
            )
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-white/25 text-xs font-medium hidden sm:block">
          {formatTime(event.starts_at)}
        </span>
        <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/40 transition-colors" />
      </div>
    </Link>
  );
}
