import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Event",
  description:
    "Update your event details including date, location, and description.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
