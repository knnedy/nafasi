import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Setup",
  description:
    "Add ticket types and publish your event to start selling tickets.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
