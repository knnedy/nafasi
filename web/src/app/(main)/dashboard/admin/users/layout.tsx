import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users",
  description: "View and manage all registered users on NAFASI.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
