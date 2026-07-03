import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Overview",
  description: "View ticket sales, revenue, and order details for your event.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
