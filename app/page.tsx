import { Sidebar } from "@/app/components/layout/sidebar";
import { BottomNav } from "@/app/components/layout/bottom-nav";
import { ComposerCard } from "@/app/components/feed/composer-card";
import { SectionDivider } from "@/app/components/feed/section-divider";
import { PostList } from "@/app/components/feed/post-list";
import { CreatePostProvider } from "@/app/components/feed/create-post-provider";
import { HomeGreeting } from "@/app/components/user/home-greeting";
import { ROOM } from "@/app/lib/data";

export default function Home() {
  return (
    <CreatePostProvider>
      <div className="flex min-h-screen bg-crema">
        <Sidebar />
        <BottomNav />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-[34px] sm:px-10 lg:pb-20">
            <div className="mb-6">
              <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-rojo">
                {ROOM.label}
              </div>
            <HomeGreeting />
              <p className="m-0 mt-[5px] text-[14.5px] text-gris-oscuro">
                {ROOM.childrenCount} niños · {ROOM.date}
              </p>
            </div>

            <ComposerCard />
            <SectionDivider />

            <PostList />
          </div>
        </main>
      </div>
    </CreatePostProvider>
  );
}
