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
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

// Nav items
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

// User avatar
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

// Sidebar content — shared between desktop and mobile
function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

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

        {/* organiser badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/8 border border-orange-500/15">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
          <span className="text-orange-400/80 text-[10px] font-black uppercase tracking-[0.2em]">
            Organiser
          </span>
        </div>
      </div>

      {/* divider */}
      <div className="mx-5 h-px bg-white/6 mb-3" />

      {/* nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] px-3 pb-2 pt-1">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-white/6 text-white"
                  : "text-white/35 hover:text-white/70 hover:bg-white/3 border border-transparent"
              }`}>
              {/* active indicator */}
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
                className={`text-sm font-semibold ${isActive ? "text-white" : ""}`}>
                {item.label}
              </span>
              {isActive && (
                <ChevronRight className="w-3 h-3 ml-auto text-white/20" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* bottom section */}
      <div className="px-3 pt-3 pb-5 space-y-0.5">
        <div className="mx-2 h-px bg-white/6 mb-3" />

        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] px-3 pb-2">
          Account
        </p>

        {/* profile */}
        <Link
          href="/profile"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/35 hover:text-white/70 hover:bg-white/3 transition-all duration-200">
          <User className="w-4 h-4 shrink-0 text-white/20" />
          <span className="text-sm font-semibold">Profile</span>
        </Link>

        {/* back to site */}
        <Link
          href="/"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/35 hover:text-white/70 hover:bg-white/3 transition-all duration-200">
          <ArrowUpRight className="w-4 h-4 shrink-0 text-white/20" />
          <span className="text-sm font-semibold">Back to site</span>
        </Link>

        {/* sign out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/40 hover:text-red-400 hover:bg-red-500/6 transition-all duration-200">
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">Sign out</span>
        </button>

        {/* user card */}
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

// Organiser dashboard layout
export default function OrganiserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
      <aside className="hidden lg:flex lg:w-52 shrink-0 flex-col fixed inset-y-0 left-0 z-30 border-r border-white/5 bg-[#0a0908]">
        <SidebarContent />
      </aside>

      {/* mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-52 flex flex-col bg-[#0a0908] border-r border-white/5 z-50 overflow-y-auto">
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* main */}
      <div className="flex-1 lg:ml-52 flex flex-col relative z-10 min-h-screen">
        {/* mobile header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-5 h-14 border-b border-white/6 bg-[#0C0A09]/90 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <Ticket className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-black tracking-[0.2em] text-xs uppercase">
              NAFASI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-orange-400/70 text-[10px] font-black uppercase tracking-widest">
              Organiser
            </span>
            <button
              onClick={() => setMobileOpen(true)}
              className="text-white/40 hover:text-white transition-colors p-1">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* page content */}
        <main className="flex-1 p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
