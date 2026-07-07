"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePublishedEvents, useEventCategories } from "@/hooks/use-events";
import EventCard from "@/app/(main)/components/event-card";
import EmptyState from "@/app/(main)/components/empty-state";
import Pagination from "@/app/(main)/components/pagination";

const PAGE_LIMIT = 9;

export default function EventsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category");
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data: categories = [] } = useEventCategories();
  const { data: events = [], isLoading } = usePublishedEvents(
    activeCategory,
    currentPage,
    PAGE_LIMIT,
  );

  const hasMore = events.length === PAGE_LIMIT;

  const setFilter = (name: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    // Always reset to page 1 when changing filters
    if (name !== "page") {
      params.delete("page");
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-2">
          Browse
        </p>
        <h1 className="text-white font-black text-4xl sm:text-5xl tracking-tight leading-tight mb-3">
          All Events
        </h1>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none mb-8">
        <button
          onClick={() => setFilter("category", null)}
          className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
            !activeCategory
              ? "bg-orange-500/15 border border-orange-500/30 text-orange-400"
              : "text-white/35 hover:text-white/60 hover:bg-white/4 border border-transparent"
          }`}>
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter("category", cat.id)} // Assuming your Go backend filters by ID or Name. Adjust if it uses name.
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeCategory === cat.id
                ? "bg-orange-500/15 border border-orange-500/30 text-orange-400"
                : "text-white/35 hover:text-white/60 hover:bg-white/4 border border-transparent"
            }`}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Loading & Empty States */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-40 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-white/5 rounded-2xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No events found"
          message="We couldn't find anything matching your filters."
          onClear={
            activeCategory ? () => setFilter("category", null) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(currentPage > 1 || hasMore) && (
        <Pagination currentPage={currentPage} hasMore={hasMore} />
      )}
    </div>
  );
}
