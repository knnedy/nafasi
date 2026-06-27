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

// Sub-nav links shown when inside /events/[id]
function eventSubNavItems(eventId: string) {
  const base = `/dashboard/organiser/events/${eventId}`;
  return [
    { href: base, label: "Overview", icon: LayoutGrid, exact: true },
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
      label: "Checked in",
      icon: ClipboardList,
      exact: true,
    },
  ];
}

// Extract event ID from pathname if inside /events/[id]
function useEventContext(pathname: string): string | null {
  const match = pathname.match(/\/events\/([^/]+)/);
  if (!match) return null;
  const id = match[1];
  // exclude static segments
  if (id === "new") return null;
  return id;
}

// Truncate event name for sidebar
function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

// Mock event name lookup — replace with store/cache when wiring data
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
    <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-500/80 to-amber-500/80 flex items-center justify-center text-white text-xs font-black border border-orange-500/20 shrink-0">
      {initials}
    </div>
  );
}

// Active section label for mobile header
function useActiveSectionLabel(pathname: string): string {
  if (pathname === "/dashboard/organiser") return "Overview";
  if (pathname.includes("/checkin/orders")) return "Checked In";
  if (pathname.includes("/checkin")) return "Check-in";
  if (pathname.includes("/orders")) return "Orders";
  if (pathname.includes("/setup")) return "Setup";
  if (pathname.includes("/events/new")) return "New Event";
  if (pathname.match(/\/events\/[^/]+$/)) return "Event";
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
      // continue regardless
    } finally {
      clearAuth();
      toast.success("Signed out successfully.");
      router.push("/signin");
    }
  };

  return (
    <div className="flex flex-col h-full select-none">
      {/* branding */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center shrink-0">
            <Ticket className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-black tracking-[0.2em] text-xs uppercase">
            NAFASI
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/8 border border-orange-500/15">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
          <span className="text-orange-400/80 text-[10px] font-black uppercase tracking-[0.2em]">
            Organiser
          </span>
        </div>
      </div>

      <div className="mx-5 h-px bg-white/6 mb-3" />

      {/* main nav */}
      <nav className="px-3 space-y-0.5">
        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] px-3 pb-2 pt-1">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          // Events item is active for all /events/* routes
          const isEventsItem = item.href === "/dashboard/organiser/events";

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={onNavClick}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-white/6 text-white"
                    : "text-white/35 hover:text-white/70 hover:bg-white/3 border border-transparent"
                }`}>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-linear-to-b from-orange-400 to-amber-500 rounded-full" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-orange-400"
                      : "text-white/25 group-hover:text-white/50"
                  }`}
                />
                <span
                  className={`text-sm font-semibold flex-1 ${isActive ? "text-white" : ""}`}>
                  {item.label}
                </span>
                {isActive && !isEventsItem && (
                  <ChevronRight className="w-3 h-3 text-white/20" />
                )}
                {isEventsItem && isActive && (
                  <ChevronRight
                    className={`w-3 h-3 transition-transform duration-200 ${
                      eventId ? "rotate-90 text-orange-400/50" : "text-white/20"
                    }`}
                  />
                )}
              </Link>

              {/* event sub-nav — shown when inside a specific event */}
              {isEventsItem && isActive && eventId && (
                <div className="ml-3 mt-1 mb-1 pl-3 border-l border-white/8 space-y-0.5">
                  {/* event name label */}
                  <p className="text-orange-400/60 text-[10px] font-black uppercase tracking-widest px-2 py-1.5 truncate">
                    {truncate(getEventName(eventId), 22)}
                  </p>
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
                        className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                          isSubActive
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/15"
                            : "text-white/30 hover:text-white/60 hover:bg-white/3"
                        }`}>
                        <SubIcon
                          className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-orange-400" : "text-white/20"}`}
                        />
                        {sub.label}
                      </Link>
                    );
                  })}

                  {/* back to all events */}
                  <Link
                    href="/dashboard/organiser/events"
                    onClick={onNavClick}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-[10px] font-bold text-white/20 hover:text-white/40 transition-colors mt-1">
                    <ArrowUpRight className="w-3 h-3 rotate-225 shrink-0" />
                    All events
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* bottom section */}
      <div className="px-3 pt-3 pb-5 space-y-0.5">
        <div className="mx-2 h-px bg-white/6 mb-3" />

        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] px-3 pb-2">
          Account
        </p>

        <Link
          href="/profile"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/35 hover:text-white/70 hover:bg-white/3 transition-all duration-200">
          <User className="w-4 h-4 shrink-0 text-white/20" />
          <span className="text-sm font-semibold">Profile</span>
        </Link>

        <Link
          href="/"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/35 hover:text-white/70 hover:bg-white/3 transition-all duration-200">
          <ArrowUpRight className="w-4 h-4 shrink-0 text-white/20" />
          <span className="text-sm font-semibold">Back to site</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/40 hover:text-red-400 hover:bg-red-500/6 transition-all duration-200">
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">Sign out</span>
        </button>

        {user && (
          <div className="flex items-center gap-2.5 px-3 py-3 mt-2 rounded-xl border border-white/6 bg-white/2">
            <UserAvatar name={user.name} />
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-bold truncate leading-tight">
                {user.name}
              </p>
              <p className="text-white/25 text-[10px] truncate mt-0.5">
                {user.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Prevent "Check-in" from staying active when on "Checked in"
function isCheckinOrdersConflict(
  sub: { href: string; label: string },
  pathname: string,
) {
  if (sub.label === "Check-in" && pathname.includes("/checkin/orders")) {
    return true;
  }
  return false;
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
    <div className="min-h-screen bg-[#0C0A09] flex font-sans">
      {/* grain */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* desktop sidebar */}
      <aside className="hidden lg:flex lg:w-56 shrink-0 flex-col fixed inset-y-0 left-0 z-30 border-r border-white/5 bg-[#0a0908] overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-56 flex flex-col bg-[#0a0908] border-r border-white/5 z-50 overflow-y-auto">
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* main */}
      <div className="flex-1 lg:ml-56 flex flex-col relative z-10 min-h-screen">
        {/* mobile header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-5 h-14 border-b border-white/6 bg-[#0C0A09]/90 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <Ticket className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-black tracking-[0.2em] text-xs uppercase">
              NAFASI
            </span>
            <span className="text-white/20 text-xs">/</span>
            <span className="text-white/50 text-xs font-bold">
              {sectionLabel}
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-white/40 hover:text-white transition-colors p-1">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* page content */}
        <main className="flex-1 p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
