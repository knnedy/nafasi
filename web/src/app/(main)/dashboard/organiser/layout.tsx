import type { Metadata } from "next";
import OrganiserDashboardLayout from "./components/dashboard-layout";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Manage your events, track sales, and monitor performance on NAFASI.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <OrganiserDashboardLayout>{children}</OrganiserDashboardLayout>;
}
