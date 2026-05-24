import type { Metadata } from "next";
import ProfileLayout from "./components/profile-layout";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "Manage your NAFASI account details, tickets orders and preferences.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProfileLayout>{children}</ProfileLayout>;
}
