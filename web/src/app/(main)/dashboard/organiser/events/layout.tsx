import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description: "View and manage all your events on NAFASI.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
