import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Categories",
  description: "Manage event categories used across the NAFASI platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
