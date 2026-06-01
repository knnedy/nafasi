"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.role === "ORGANISER") router.replace("/dashboard/organiser");
    else if (user.role === "ADMIN") router.replace("/dashboard/admin");
    else router.replace("/");
  }, [user, router]);

  return null;
}
