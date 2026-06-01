"use client";

import { useAuthStore } from "@/store/auth";
import {
  CalendarClock,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Ticket,
  User,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Nav links — desktop
function NavLinks() {
  return (
    <div className="hidden md:flex items-center gap-1">
      <Link
        href="/events"
        className="group relative flex items-center gap-2 px-4 py-2 rounded-lg text-white/45 hover:text-white text-sm font-semibold transition-all duration-200 hover:bg-white/4">
        <Zap className="w-3.5 h-3.5 text-orange-500/60 group-hover:text-orange-400 transition-colors" />
        Events
      </Link>
      <Link
        href="/upcoming"
        className="group relative flex items-center gap-2 px-4 py-2 rounded-lg text-white/45 hover:text-white text-sm font-semibold transition-all duration-200 hover:bg-white/4">
        <CalendarClock className="w-3.5 h-3.5 text-purple-500/60 group-hover:text-purple-400 transition-colors" />
        Upcoming
      </Link>
    </div>
  );
}

// User avatar initials
function UserAvatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`rounded-full bg-linear-to-br from-orange-500/80 to-amber-500/80 flex items-center justify-center text-white font-black border border-orange-500/30 shrink-0 ${
        size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs"
      }`}>
      {initials}
    </div>
  );
}

// Authenticated user dropdown
function UserDropdown() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.public.post("/api/v1/auth/logout", {});
    } catch {
      // backend clears cookies via defer even on error — safe to continue
    } finally {
      clearAuth();
      toast.success("Signed out successfully.");
      router.push("/");
    }
  };

  if (!user) return null;

  const isDashboardUser = user.role === "ORGANISER" || user.role === "ADMIN";

  const dashboardHref =
    user.role === "ORGANISER" ? "/dashboard/organiser" : "/dashboard/admin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/4 border border-white/8 hover:bg-white/7 hover:border-white/12 transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-orange-500/50">
          <UserAvatar name={user.name} size="sm" />
          <span className="hidden sm:block text-white text-xs font-bold">
            {user.name.split(" ")[0]}
          </span>
          <ChevronRight className="w-3 h-3 text-white/20 hidden sm:block" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-52 bg-[#131110] border border-white/8 rounded-xl p-1 shadow-2xl shadow-black/60">
        {/* user info header */}
        <DropdownMenuLabel className="px-3 py-3">
          <div className="flex items-center gap-2.5">
            <UserAvatar name={user.name} size="md" />
            <div className="min-w-0">
              <p className="text-white text-xs font-bold truncate leading-tight">
                {user.name}
              </p>
              <p className="text-white/30 text-[10px] truncate mt-0.5">
                {user.email}
              </p>
              <span className="text-[9px] font-black uppercase tracking-wider text-orange-400/70 mt-0.5 block">
                {user.role.toLowerCase()}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/6 mx-1 my-0.5" />

        <DropdownMenuGroup>
          {/* dashboard — organiser and admin only */}
          {isDashboardUser && (
            <DropdownMenuItem asChild>
              <Link
                href={dashboardHref}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 cursor-pointer transition-colors text-sm font-medium outline-none">
                <LayoutDashboard className="w-4 h-4 text-white/25" />
                Dashboard
              </Link>
            </DropdownMenuItem>
          )}

          {/* profile — all roles */}
          <DropdownMenuItem asChild>
            <Link
              href="/profile"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 cursor-pointer transition-colors text-sm font-medium outline-none">
              <User className="w-4 h-4 text-white/25" />
              Profile
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-white/6 mx-1 my-0.5" />

        {/* sign out */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/6 cursor-pointer transition-colors text-sm font-medium outline-none">
          <LogOut className="w-4 h-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Main navbar
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.public.post("/api/v1/auth/logout", {});
    } catch {
      // backend clears cookies via defer even on error — safe to continue
    } finally {
      clearAuth();
      toast.success("Signed out successfully.");
      router.push("/signin");
      setMobileMenuOpen(false);
    }
  };

  const isDashboardUser = user?.role === "ORGANISER" || user?.role === "ADMIN";

  const dashboardHref =
    user?.role === "ORGANISER" ? "/dashboard/organiser" : "/dashboard/admin";

  return (
    <nav className="sticky top-0 z-50 border-b border-white/6 bg-[#0C0A09]/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center">
            <Ticket className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-black tracking-[0.2em] text-sm uppercase">
            NAFASI
          </span>
        </Link>

        {/* desktop nav links */}
        <NavLinks />

        {/* desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <>
              <Link
                href="/signin"
                className="text-white/45 hover:text-white text-sm font-semibold transition-colors px-3 py-2">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/25 transition-all duration-200">
                Get started
              </Link>
            </>
          )}
        </div>

        {/* mobile toggle */}
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

      {/* mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/6 bg-[#0C0A09] px-6 py-4 space-y-1">
          <Link
            href="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 text-white/60 hover:text-white text-sm font-semibold py-2.5 px-3 rounded-lg hover:bg-white/4 transition-colors">
            <Zap className="w-4 h-4 text-orange-500/60" />
            Events
          </Link>
          <Link
            href="/upcoming"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 text-white/60 hover:text-white text-sm font-semibold py-2.5 px-3 rounded-lg hover:bg-white/4 transition-colors">
            <CalendarClock className="w-4 h-4 text-purple-500/60" />
            Upcoming
          </Link>

          <div className="pt-3 border-t border-white/6 flex flex-col gap-1 mt-2">
            {isAuthenticated && user ? (
              <>
                {/* user info */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3 border border-white/6 mb-1">
                  <UserAvatar name={user.name} size="md" />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold truncate">
                      {user.name}
                    </p>
                    <p className="text-white/30 text-xs truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* dashboard — organiser and admin only */}
                {isDashboardUser && (
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 text-white/60 hover:text-white text-sm font-semibold py-2.5 px-3 rounded-lg hover:bg-white/4 transition-colors">
                    <LayoutDashboard className="w-4 h-4 text-white/30" />
                    Dashboard
                  </Link>
                )}

                {/* profile — all roles */}
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 text-white/60 hover:text-white text-sm font-semibold py-2.5 px-3 rounded-lg hover:bg-white/4 transition-colors">
                  <User className="w-4 h-4 text-white/30" />
                  Profile
                </Link>

                <div className="h-px bg-white/6 mx-1 my-1" />

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 text-red-400/70 hover:text-red-400 text-sm font-semibold py-2.5 px-3 rounded-lg hover:bg-red-500/6 transition-colors w-full text-left">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2.5 rounded-xl border border-white/8 text-white/70 text-sm font-semibold">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
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
