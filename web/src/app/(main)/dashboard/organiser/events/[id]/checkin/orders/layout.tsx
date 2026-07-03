import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checked In",
  description: "View all attendees who have been checked in for this event.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
