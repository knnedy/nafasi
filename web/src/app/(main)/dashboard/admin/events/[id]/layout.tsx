import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Detail",
  description: "View event details and manage cancellation or deletion.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
