import type { ReactNode } from "react";
import { Sidebar } from "@/app/components/layout/sidebar";
import { BottomNav } from "@/app/components/layout/bottom-nav";

export default function FamilyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar variant="family" />
      <BottomNav variant="family" />
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
