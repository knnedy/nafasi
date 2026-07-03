import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Detail",
  description:
    "View user details and manage account status, verification, and role.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
