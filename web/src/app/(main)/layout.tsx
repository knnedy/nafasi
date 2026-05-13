import AppLayout from "./components/app-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "NAFASI — Discover. Book. Experience.",
    template: "%s | NAFASI",
  },
  description:
    "Discover and book tickets to the best concerts, conferences, festivals and events happening in Nairobi and across East Africa.",
  keywords: [
    "events",
    "tickets",
    "Nairobi",
    "Kenya",
    "East Africa",
    "concerts",
    "conferences",
    "discover",
    "book",
  ],
  openGraph: {
    title: "NAFASI — Discover. Book. Experience.",
    description:
      "Discover and book tickets to the best events happening in Nairobi and across East Africa.",
    siteName: "NAFASI",
    locale: "en_KE",
    type: "website",
  },
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
