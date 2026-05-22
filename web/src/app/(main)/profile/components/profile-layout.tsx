"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Ticket, Settings, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/auth";

// Nav items
const NAV_ITEMS = [
  {
    href: "/profile",
    label: "Profile",
    description: "Personal information",
    icon: User,
  },
  {
    href: "/profile/orders",
    label: "Orders",
    description: "Tickets & purchases",
    icon: Ticket,
  },
  {
    href: "/profile/settings",
    label: "Settings",
    description: "Password & account",
    icon: Settings,
  },
];

// User avatar
function UserAvatar({ name, url }: { name: string; url?: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-12 h-12 rounded-full object-cover border-2 border-orange-500/30 shrink-0"
      />
    );
  }

  return (
    <div className="w-12 h-12 rounded-full bg-linear-to-br from-orange-500/80 to-amber-500/80 flex items-center justify-center text-white text-sm font-black border-2 border-orange-500/30 shrink-0">
      {initials}
    </div>
  );
}

// Profile layout
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const currentUser = user ?? {
    name: "Ada Okonkwo",
    email: "ada@example.com",
    role: "ATTENDEE",
    avatar_url: "",
  };

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-2">
            {/* user card */}
            <div className="rounded-2xl border border-white/8 bg-white/2 p-4 flex items-center gap-3 mb-6">
              <UserAvatar
                name={currentUser.name}
                url={currentUser.avatar_url ?? ""}
              />
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-white/35 text-xs truncate mt-0.5">
                  {currentUser.email}
                </p>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400/80 mt-1 block">
                  {currentUser.role.toLowerCase()}
                </span>
              </div>
            </div>

            {/* nav links */}
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-orange-500/10 border border-orange-500/20"
                        : "hover:bg-white/4 border border-transparent"
                    }`}>
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                        isActive
                          ? "bg-orange-500/20"
                          : "bg-white/4 group-hover:bg-white/8"
                      }`}>
                      <Icon
                        className="w-4 h-4"
                        style={{ color: isActive ? "#f97316" : undefined }}
                        color={isActive ? undefined : "rgb(255 255 255 / 0.3)"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold leading-tight ${
                          isActive
                            ? "text-orange-400"
                            : "text-white/60 group-hover:text-white/90"
                        }`}>
                        {item.label}
                      </p>
                      <p className="text-white/25 text-xs mt-0.5 truncate">
                        {item.description}
                      </p>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-orange-400/50 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
