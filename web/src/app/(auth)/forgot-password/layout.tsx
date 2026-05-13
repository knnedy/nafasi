import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your NAFASI password.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
