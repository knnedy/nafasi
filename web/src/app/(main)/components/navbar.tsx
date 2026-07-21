"use client";

import { useAuthStore } from "@/store/auth";
import { ChevronDown, Menu, Ticket, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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

/* ─── Avatar ─── */
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
      className={`rounded-full bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black border border-orange-400/30 shrink-0 shadow-[0_0_10px_rgba(249,115,22,0.2)] ${
        size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-[10px]"
      }`}>
      {initials}
    </div>
  );
}

const NAV_LINKS = [
  { href: "/events", label: "Events" },
  { href: "/upcoming", label: "Upcoming" },
];

/* ─── Desktop Nav Links ─── */
function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex items-center gap-1">
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`relative px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
              active ? "text-white" : "text-white/40 hover:text-white"
            }`}>
            {label}
            <span
              className={`absolute bottom-0.5 left-4 right-4 h-px rounded-full bg-linear-to-r from-orange-500 to-amber-500 transition-transform duration-300 origin-left ${
                active ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </Link>
        );
      })}
    </div>
  );
}

/* ─── User Dropdown ─── */
function UserDropdown() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.public.post("/api/v1/auth/logout", {});
    } catch {
      // backend clears cookies via defer even on error
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
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={`group flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full border transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 cursor-pointer ${
            open
              ? "bg-white/6 border-white/10"
              : "bg-white/3 border-white/6 hover:bg-white/6 hover:border-white/10"
          }`}>
          <UserAvatar name={user.name} size="sm" />
          <span className="hidden sm:block text-white/80 text-xs font-semibold">
            {user.name.split(" ")[0]}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-white/25 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="relative w-60 bg-[#131110]/95 backdrop-blur-2xl border border-white/6 rounded-2xl p-2 shadow-2xl shadow-black/60">
        {/* Arrow */}
        <div className="absolute -top-1.25 right-5.5 w-2.5 h-2.5 bg-[#131110] border-t border-l border-white/6 rotate-45" />

        {/* Header */}
        <DropdownMenuLabel className="px-3 py-3">
          <div className="flex items-center gap-3">
            <UserAvatar name={user.name} size="md" />
            <div className="min-w-0">
              <p className="text-white text-[13px] font-bold truncate leading-snug">
                {user.name}
              </p>
              <p className="text-white/25 text-[11px] truncate">{user.email}</p>
              <div className="mt-1.5 inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/15">
                <div className="w-1 h-1 rounded-full bg-orange-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-orange-400/80">
                  {user.role.toLowerCase()}
                </span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="h-px bg-linear-to-r from-transparent via-white/6 to-transparent mx-2 my-1" />

        <DropdownMenuGroup className="px-1 py-0.5 space-y-0.5">
          {isDashboardUser && (
            <DropdownMenuItem asChild>
              <Link
                href={dashboardHref}
                className="group flex items-center px-3 py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/4 border-l-2 border-transparent hover:border-orange-500/50 transition-all duration-200 text-[13px] font-medium outline-none cursor-pointer">
                Dashboard
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild>
            <Link
              href="/profile"
              className="group flex items-center px-3 py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/4 border-l-2 border-transparent hover:border-orange-500/50 transition-all duration-200 text-[13px] font-medium outline-none cursor-pointer">
              Profile
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="h-px bg-linear-to-r from-transparent via-white/6 to-transparent mx-2 my-1" />

        <div className="px-1 py-0.5">
          <DropdownMenuItem
            onClick={handleLogout}
            className="group flex items-center px-3 py-2 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/4 border-l-2 border-transparent hover:border-red-500/40 transition-all duration-200 text-[13px] font-medium outline-none cursor-pointer">
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Main Navbar ─── */
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await api.public.post("/api/v1/auth/logout", {});
    } catch {
      // safe to continue
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
    <nav className="sticky top-0 z-50 border-b border-white/6 bg-[#0C0A09]/70 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/35 transition-shadow duration-300">
            <Ticket className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-black tracking-[0.2em] text-sm uppercase">
            NAFASI
          </span>
        </Link>

        {/* Desktop Nav */}
        <NavLinks />

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <>
              <Link
                href="/signin"
                className="text-white/40 hover:text-white text-sm font-semibold transition-colors duration-300 px-3 py-2">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 rounded-full font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all duration-300">
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white/40 hover:text-white transition-colors duration-300 p-2 rounded-xl hover:bg-white/4"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileRef}
          className="md:hidden border-t border-white/6 bg-[#0C0A09]/95 backdrop-blur-2xl px-6 py-5 space-y-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm font-semibold py-3 px-4 rounded-2xl transition-all duration-200 ${
                  active
                    ? "text-white bg-white/4"
                    : "text-white/45 hover:text-white hover:bg-white/3"
                }`}>
                {label}
              </Link>
            );
          })}

          <div className="pt-4 mt-2 border-t border-white/6 flex flex-col gap-1.5">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/2 border border-white/5 mb-2">
                  <UserAvatar name={user.name} size="md" />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold truncate">
                      {user.name}
                    </p>
                    <p className="text-white/25 text-xs truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {isDashboardUser && (
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-white/45 hover:text-white text-sm font-semibold py-3 px-4 rounded-2xl hover:bg-white/3 transition-all duration-200">
                    Dashboard
                  </Link>
                )}

                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/45 hover:text-white text-sm font-semibold py-3 px-4 rounded-2xl hover:bg-white/3 transition-all duration-200">
                  Profile
                </Link>

                <div className="h-px bg-linear-to-r from-transparent via-white/6 to-transparent mx-2 my-2" />

                <button
                  onClick={handleLogout}
                  className="text-red-400/70 hover:text-red-400 text-sm font-semibold py-3 px-4 rounded-2xl hover:bg-red-500/4 transition-all duration-200 w-full text-left">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-5 py-3 rounded-2xl border border-white/6 text-white/50 text-sm font-semibold hover:bg-white/3 hover:text-white/80 transition-all duration-200">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-5 py-3 rounded-2xl font-bold text-sm text-white bg-linear-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300">
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
