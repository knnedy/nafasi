import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan Tickets",
  description: "Scan and validate attendee QR codes for entry.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
