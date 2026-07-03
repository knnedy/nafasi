import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organisers",
  description: "View and manage organiser accounts and verification status.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
