import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description: "View and moderate all events on the NAFASI platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
