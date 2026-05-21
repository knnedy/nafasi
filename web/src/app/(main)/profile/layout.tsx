import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your NAFASI account details, tickets and preferences.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
