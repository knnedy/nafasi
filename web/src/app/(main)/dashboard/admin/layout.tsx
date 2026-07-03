import type { Metadata } from "next";
import AdminDashboardLayout from "./components/dashboard-layout";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description:
    "Platform overview — monitor users, events, orders, and revenue across NAFASI.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}
