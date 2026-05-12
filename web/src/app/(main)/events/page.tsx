"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { MOCK_CATEGORIES, MOCK_PUBLISHED } from "@/app/(main)/mock_events";
import EventCard from "../components/event-card";
import EmptyState from "../components/empty-state";

const PAGE_SIZE = 9;

// Events page
export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let results = MOCK_PUBLISHED;

    if (activeCategory !== null) {
      results = results.filter((e) => {
        const cat = MOCK_CATEGORIES.find((c) => c.id === e.category_id);
        return cat?.name === activeCategory;
      });
    }

    if (search.trim() !== "") {
      const q = search.toLowerCase();
      results = results.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q),
      );
    }

    return results;
  }, [search, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleCategoryChange(name: string | null) {
    setActiveCategory(name);
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  const hasActiveFilters = activeCategory !== null || search.trim() !== "";

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
      {/* page header */}
      <div className="mb-10">
        <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-2">
          Browse
        </p>
        <h1 className="text-white font-black text-4xl sm:text-5xl tracking-tight leading-tight mb-3">
          All Events
        </h1>
        <p className="text-white/30 text-sm">
          {filtered.length === MOCK_PUBLISHED.length
            ? `${MOCK_PUBLISHED.length} events available`
            : `${filtered.length} of ${MOCK_PUBLISHED.length} events`}
        </p>
      </div>

      {/* search + filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search events, venues, locations…"
            className="w-full h-11 pl-11 pr-10 rounded-xl bg-white/4 border border-white/8 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-orange-500/40 focus:bg-white/6 transition-all duration-200"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* clear filters */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              handleSearch("");
              handleCategoryChange(null);
            }}
            className="h-11 px-4 rounded-xl border border-white/8 text-white/40 hover:text-white/70 text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:bg-white/4 flex items-center gap-2 shrink-0">
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none mb-8">
        <button
          onClick={() => handleCategoryChange(null)}
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
              handleCategoryChange(
                activeCategory === cat.name ? null : cat.name,
              )
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

      {/* results */}
      {paginated.length === 0 ? (
        <EmptyState message="No events match your search. Try a different keyword or category." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      )}

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/6">
          {/* page info */}
          <p className="text-white/25 text-xs font-semibold">
            Page {page} of {totalPages} &mdash; {filtered.length} events
          </p>

          {/* controls */}
          <div className="flex items-center gap-1.5">
            {/* prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-9 px-4 rounded-lg text-xs font-bold text-white/40 hover:text-white border border-white/8 hover:bg-white/4 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200">
              Prev
            </button>

            {/* page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (totalPages <= 7) return true;
                if (p === 1 || p === totalPages) return true;
                if (Math.abs(p - page) <= 1) return true;
                return false;
              })
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push("ellipsis");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-9 h-9 flex items-center justify-center text-white/20 text-xs">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all duration-200 ${
                      page === item
                        ? "bg-orange-500/15 border border-orange-500/30 text-orange-400"
                        : "text-white/35 hover:text-white/60 hover:bg-white/4 border border-transparent"
                    }`}>
                    {item}
                  </button>
                ),
              )}

            {/* next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-9 px-4 rounded-lg text-xs font-bold text-white/40 hover:text-white border border-white/8 hover:bg-white/4 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
