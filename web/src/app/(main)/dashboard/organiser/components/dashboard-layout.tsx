"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Ticket,
  LayoutDashboard,
  CalendarDays,
  ShoppingBag,
  ArrowUpRight,
  LogOut,
  User,
  Menu,
  ChevronRight,
  ScanLine,
  ClipboardList,
  LayoutGrid,
  Edit,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

const NAV_ITEMS = [
  {
    href: "/dashboard/organiser",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/organiser/events",
    label: "Events",
    icon: CalendarDays,
    exact: false,
  },
  {
    href: "/dashboard/organiser/orders",
    label: "Orders",
    icon: ShoppingBag,
    exact: false,
  },
];

function eventSubNavItems(eventId: string) {
  const base = `/dashboard/organiser/events/${eventId}`;
  return [
    { href: base, label: "Overview", icon: LayoutGrid, exact: true },
    { href: `${base}/edit`, label: "Edit Event", icon: Edit, exact: false },
    {
      href: `${base}/ticket-types`,
      label: "Ticket Types",
      icon: Ticket,
      exact: false,
    },
    {
      href: `${base}/orders`,
      label: "Orders",
      icon: ShoppingBag,
      exact: false,
    },
    {
      href: `${base}/checkin`,
      label: "Check-in",
      icon: ScanLine,
      exact: false,
    },
    {
      href: `${base}/checkin/orders`,
      label: "Checked In",
      icon: ClipboardList,
      exact: true,
    },
  ];
}

function useEventContext(pathname: string): string | null {
  const match = pathname.match(/\/events\/([^/]+)/);
  if (!match) return null;
  const id = match[1];
  if (id === "new") return null;
  return id;
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

const MOCK_EVENT_NAMES: Record<string, string> = {
  "550e8400-e29b-41d4-a716-446655440001": "Afropunk Nairobi 2026",
};

function getEventName(id: string) {
  return MOCK_EVENT_NAMES[id] ?? "Event";
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-orange-500/10 shadow-lg shrink-0">
      {initials}
    </div>
  );
}

function useActiveSectionLabel(pathname: string): string {
  if (pathname === "/dashboard/organiser") return "Overview";
  if (pathname.includes("/checkin/orders")) return "Checked In";
  if (pathname.includes("/checkin")) return "Check-in";
  if (pathname.includes("/ticket-types")) return "Ticket Types";
  if (pathname.includes("/orders")) return "Orders";
  if (pathname.includes("/events/new")) return "New Event";
  if (pathname.match(/\/events\/[^/]+$/)) return "Event Overview";
  if (pathname.includes("/events/") && pathname.includes("/edit"))
    return "Edit Event";
  if (pathname.includes("/events")) return "Events";
  return "Dashboard";
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const eventId = useEventContext(pathname);

  const handleLogout = async () => {
    try {
      await api.public.post("/api/v1/auth/logout", {});
    } catch {
      // safe fallback
    } finally {
      clearAuth();
      toast.success("Signed out successfully.");
      router.push("/signin");
    }
  };

  return (
    <div className="flex flex-col h-full select-none bg-[#090706]">
      {/* Brand Header */}
      <div className="px-6 pt-7 pb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-transform duration-300 group-hover:scale-105">
              <Ticket
                className="w-4 h-4 text-white transform -rotate-12"
                strokeWidth={2.5}
              />
            </div>
            <span className="text-white font-black tracking-[0.25em] text-sm font-sans">
              NAFASI
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/5 border border-orange-500/15 shadow-inner">
            <span className="w-1 h-1 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-orange-400/90 text-[9px] font-bold uppercase tracking-wider">
              Org
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Main Navigation Stack with Sleek Custom Scrollbar */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-500/30">
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] px-3 mb-2">
          Workspace
        </p>

        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          const isEventsItem = item.href === "/dashboard/organiser/events";

          return (
            <div key={item.href} className="space-y-1">
              <Link
                href={item.href}
                onClick={onNavClick}
                className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? "bg-white/6 border-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "bg-transparent border-transparent text-white/40 hover:text-white/80 hover:bg-white/2"
                }`}>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-linear-to-b from-orange-400 to-amber-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                    isActive
                      ? "text-orange-400"
                      : "text-white/30 group-hover:text-white/60"
                  }`}
                />
                <span
                  className={`text-sm font-medium tracking-wide ${isActive ? "font-semibold text-white" : ""}`}>
                  {item.label}
                </span>

                {isEventsItem && isActive && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 ml-auto text-white/20 transition-transform duration-300 ${
                      eventId ? "rotate-90 text-orange-400/60" : ""
                    }`}
                  />
                )}
              </Link>

              {/* Contextual Sub-Nav Frame */}
              {isEventsItem && isActive && eventId && (
                <div className="mt-1.5 mx-1 p-2 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md space-y-1">
                  <div className="px-2.5 py-1.5 mb-1 bg-white/2 rounded-lg border border-white/2">
                    <p className="text-orange-400/80 text-[10px] font-bold uppercase tracking-wider truncate">
                      {truncate(getEventName(eventId), 20)}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    {eventSubNavItems(eventId).map((sub) => {
                      const isSubActive = sub.exact
                        ? pathname === sub.href
                        : pathname.startsWith(sub.href) &&
                          !isCheckinOrdersConflict(sub, pathname);
                      const SubIcon = sub.icon;

                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={onNavClick}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                            isSubActive
                              ? "bg-orange-500/10 text-orange-400 border-orange-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                              : "bg-transparent border-transparent text-white/40 hover:text-white/70 hover:bg-white/2"
                          }`}>
                          <SubIcon
                            className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-orange-400" : "text-white/20"}`}
                          />
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>

                  <Link
                    href="/dashboard/organiser/events"
                    onClick={onNavClick}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-white/30 hover:text-white/60 hover:bg-white/2 transition-all mt-1">
                    <ArrowLeft className="w-3 h-3 text-white/30" />
                    All Events
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Management Deck */}
      <div className="p-4 space-y-1 bg-linear-to-t from-black/40 to-transparent">
        <div className="mx-2 mb-3">
          <div className="h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] px-3 mb-1">
          Preferences
        </p>

        <Link
          href="/profile"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/2 transition-all text-sm font-medium">
          <User className="w-4 h-4 text-white/20" />
          Profile
        </Link>

        <Link
          href="/"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/2 transition-all text-sm font-medium">
          <ArrowUpRight className="w-4 h-4 text-white/20" />
          Live Site
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-red-400/50 hover:text-red-400 hover:bg-red-500/4 transition-all text-sm font-medium text-left">
          <LogOut className="w-4 h-4 opacity-80" />
          Sign out
        </button>

        {user && (
          <div className="mt-3 flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/2 shadow-inner">
            <UserAvatar name={user.name} />
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate tracking-wide leading-none mb-1">
                {user.name}
              </p>
              <p className="text-white/30 text-[10px] truncate tracking-wider">
                {user.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function isCheckinOrdersConflict(
  sub: { href: string; label: string },
  pathname: string,
) {
  return sub.label === "Check-in" && pathname.includes("/checkin/orders");
}

export default function OrganiserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const sectionLabel = useActiveSectionLabel(pathname);

  return (
    <div className="min-h-screen bg-[#0C0A09] flex font-sans antialiased text-white/90 selection:bg-orange-500/30 selection:text-white">
      {/* UI Analog Grain Overlay */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none z-50 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Desktop Sidebar Panel */}
      <aside className="hidden lg:flex lg:w-60 shrink-0 flex-col fixed inset-y-0 left-0 z-30 border-r border-white/5 bg-[#090706]">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Slide-out */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-60 flex flex-col bg-[#090706] border-r border-white/5 z-50 animate-in slide-in-from-left duration-300 ease-out">
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Core Interface Workspace */}
      <div className="flex-1 lg:ml-60 flex flex-col relative z-10 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-6 h-16 border-b border-white/5 bg-[#0C0A09]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
              <Ticket className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-black tracking-[0.2em] text-xs">
              NAFASI
            </span>
            <span className="text-white/20 text-sm">/</span>
            <span className="text-white/60 text-xs font-semibold tracking-wide">
              {sectionLabel}
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-white/50 hover:text-white transition-colors p-2 -mr-2 rounded-xl bg-white/5 border border-white/5 active:scale-95">
            <Menu className="w-4 h-4" />
          </button>
        </header>

        {/* Dynamic Canvas Area */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
