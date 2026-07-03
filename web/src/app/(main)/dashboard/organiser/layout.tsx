import type { Metadata } from "next";
import OrganiserDashboardLayout from "./components/dashboard-layout";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Manage your events, track ticket sales, and monitor revenue from your organiser dashboard.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <OrganiserDashboardLayout>{children}</OrganiserDashboardLayout>;
}
