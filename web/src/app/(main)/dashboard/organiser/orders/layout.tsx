import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders",
  description: "View and manage ticket orders across all your events.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
