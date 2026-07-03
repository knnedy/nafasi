import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Event",
  description: "Create a new event on NAFASI and start selling tickets.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
