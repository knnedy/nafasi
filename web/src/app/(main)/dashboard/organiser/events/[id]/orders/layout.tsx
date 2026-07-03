import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Orders",
  description: "View and manage all ticket orders for this event.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
