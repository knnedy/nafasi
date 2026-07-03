import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders",
  description: "View and manage all ticket orders across the platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
