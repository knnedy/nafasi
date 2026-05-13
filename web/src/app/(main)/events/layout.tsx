import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Browse all published events happening in Nairobi and across East Africa. Concerts, conferences, festivals and more.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
