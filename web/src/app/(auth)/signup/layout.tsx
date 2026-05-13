import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create a free NAFASI account to discover and book tickets to the best events in Nairobi and East Africa.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
