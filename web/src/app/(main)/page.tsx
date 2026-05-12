"use client";

import { useState } from "react";
import Link from "next/link";
import { Ticket, ArrowRight, ArrowUpRight } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import {
  MOCK_CATEGORIES,
  MOCK_PUBLISHED,
  MOCK_UPCOMING,
} from "@/app/(main)/mock_events";
import EventCard from "./components/event-card";
import UpcomingRow from "./components/upcoming-row";

// Empty state
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
        <Ticket className="w-6 h-6 text-white/15" />
      </div>
      <p className="text-white/20 text-sm">{message}</p>
    </div>
  );
}

// Main page
export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  const published =
    activeCategory === null
      ? MOCK_PUBLISHED
      : MOCK_PUBLISHED.filter((e) => {
          const cat = MOCK_CATEGORIES.find((c) => c.id === e.category_id);
          return cat?.name === activeCategory;
        });

  const upcoming =
    activeCategory === null
      ? MOCK_UPCOMING
      : MOCK_UPCOMING.filter((e) => {
          const cat = MOCK_CATEGORIES.find((c) => c.id === e.category_id);
          return cat?.name === activeCategory;
        });

  return (
    <div className="relative z-10">
      {/* hero — compact */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-10">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="inline-flex items-center gap-2.5 bg-orange-500/8 border border-orange-500/20 rounded-full px-5 py-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-400" />
            </span>
            <span className="text-orange-400/90 text-xs font-bold uppercase tracking-[0.2em]">
              {MOCK_PUBLISHED.length} events live in Nairobi
            </span>
          </div>

          <div className="space-y-1 max-w-4xl">
            <h1 className="text-white font-black text-5xl sm:text-6xl leading-[0.95] tracking-tight">
              Your next{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-400 via-amber-400 to-orange-500">
                unforgettable
              </span>{" "}
              experience.
            </h1>
          </div>

          <p className="text-white/35 text-base max-w-md leading-relaxed">
            Concerts, conferences, festivals, comedy — all in one place. Book
            tickets in seconds.
          </p>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              href="/events"
              className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-xl shadow-orange-500/20 transition-all duration-300 flex items-center gap-2">
              Browse all events
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/upcoming"
              className="px-6 py-3 rounded-xl font-bold text-sm text-white/55 hover:text-white bg-white/4 border border-white/8 hover:bg-white/[0.07] transition-all duration-200">
              Upcoming events
            </Link>
          </div>
        </div>
      </section>

      {/* category filter + section header combined */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
              Happening now
            </p>
            <h2 className="text-white font-black text-2xl tracking-tight">
              Published Events
            </h2>
          </div>
          <Link
            href="/events"
            className="group flex items-center gap-1.5 text-white/40 hover:text-orange-400 text-sm font-bold transition-colors shrink-0">
            See all
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* categories sit directly under the section header, clearly tied to events below */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
      </section>

      {/* published events */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        {published.length === 0 ? (
          <EmptyState message="No events found in this category." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {published.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* upcoming events */}
      <section
        className="border-y border-white/5"
        style={{ background: "rgba(255,255,255,0.012)" }}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
                Coming up
              </p>
              <h2 className="text-white font-black text-2xl tracking-tight">
                Upcoming Events
              </h2>
            </div>
            <Link
              href="/upcoming"
              className="group flex items-center gap-1.5 text-white/40 hover:text-orange-400 text-sm font-bold transition-colors shrink-0 ml-4">
              See all
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <EmptyState message="No upcoming events found in this category." />
          ) : (
            <div className="space-y-2">
              {upcoming.map((event, i) => (
                <UpcomingRow key={event.id} event={event} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA banner */}
      {!isAuthenticated && (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="relative rounded-3xl overflow-hidden border border-white/[0.07] p-12 sm:p-16 text-center">
            <div
              className="absolute inset-0"
              style={{ background: "#0f0d0b" }}
            />
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(251,146,60,1) 0%, transparent 60%)",
              }}
            />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-linear-to-r from-transparent via-orange-500 to-transparent" />

            <div className="relative z-10 space-y-5 max-w-xl mx-auto">
              <p className="text-orange-400/70 text-[10px] font-black tracking-[0.3em] uppercase">
                Join NAFASI
              </p>
              <h2 className="text-white font-black text-4xl sm:text-5xl tracking-tight leading-tight">
                Ready to experience more?
              </h2>
              <p className="text-white/35 text-base leading-relaxed">
                Create a free account to book tickets, save events, and never
                miss out again.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                <Link
                  href="/sign-up"
                  className="px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-xl shadow-orange-500/20 transition-all duration-300 flex items-center gap-2">
                  Create free account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/signin"
                  className="px-7 py-3.5 rounded-xl font-bold text-sm text-white/40 hover:text-white transition-colors">
                  Already have an account?
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* footer */}
      <footer className="border-t border-white/5 max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center">
            <Ticket className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white/35 text-xs font-black tracking-[0.2em] uppercase">
            NAFASI
          </span>
        </div>
        <p className="text-white/15 text-xs">
          © 2026 NAFASI Ltd. All rights reserved.
        </p>
        <div className="flex items-center gap-5">
          <Link
            href="/events"
            className="text-white/20 hover:text-white/50 text-xs font-semibold transition-colors">
            Events
          </Link>
          <Link
            href="/upcoming"
            className="text-white/20 hover:text-white/50 text-xs font-semibold transition-colors">
            Upcoming
          </Link>
          <Link
            href="/sign-up"
            className="text-white/20 hover:text-white/50 text-xs font-semibold transition-colors">
            Sign up
          </Link>
        </div>
      </footer>
    </div>
  );
}
