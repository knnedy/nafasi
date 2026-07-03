import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ticket Types",
  description: "Manage ticket types, pricing, and availability for your event.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
