"use client";

import { useAuthStore } from "@/store/auth";
import { ChevronRight, Menu, Ticket, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  return (
    <nav className="sticky top-0 z-50 border-b border-white/6 bg-[#0C0A09]/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center">
            <Ticket className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-black tracking-[0.2em] text-sm uppercase">
            NAFASI
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/4 border border-white/8 text-white/70 hover:text-white text-sm font-semibold transition-all duration-200 hover:bg-white/[0.07]">
              {user?.name?.split(" ")[0]}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-white/45 hover:text-white text-sm font-semibold transition-colors px-3 py-2">
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/25 transition-all duration-200">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-white/50 hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/6 bg-[#0C0A09] px-6 py-4 space-y-1">
          <Link
            href="/events"
            className="block text-white/60 hover:text-white text-sm font-semibold py-2.5 px-3 rounded-lg hover:bg-white/4 transition-colors">
            Events
          </Link>
          <Link
            href="/upcoming"
            className="block text-white/60 hover:text-white text-sm font-semibold py-2.5 px-3 rounded-lg hover:bg-white/4 transition-colors">
            Upcoming
          </Link>
          <div className="pt-3 border-t border-white/6 flex flex-col gap-2 mt-2">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="text-center px-4 py-2.5 rounded-xl bg-white/4 border border-white/8 text-white text-sm font-semibold">
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-center px-4 py-2.5 rounded-xl border border-white/8 text-white/70 text-sm font-semibold">
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="text-center px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
