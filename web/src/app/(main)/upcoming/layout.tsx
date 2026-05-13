import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upcoming",
  description:
    "See what's coming up in Nairobi and East Africa. Plan ahead and book tickets to upcoming concerts, conferences, festivals and more.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
