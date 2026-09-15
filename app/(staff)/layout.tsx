import type { ReactNode } from "react";
import { Sidebar } from "@/app/components/layout/sidebar";
import { BottomNav } from "@/app/components/layout/bottom-nav";
import { CreatePostProvider } from "@/app/components/feed/create-post-provider";
import { getComposerData } from "@/app/lib/composer-data";
import { getProfile } from "@/app/lib/dal";

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const [profile, composerData] = await Promise.all([
    getProfile(),
    getComposerData(),
  ]);

  return (
    <CreatePostProvider
      rooms={composerData.rooms}
      childrenByRoom={composerData.childrenByRoom}
      canPost={profile?.role === "staff"}
    >
      <div className="flex min-h-screen bg-crema">
        <Sidebar variant="staff" />
        <BottomNav variant="staff" />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </CreatePostProvider>
  );
}
