import { Sidebar } from "@/app/components/layout/sidebar";
import { BottomNav } from "@/app/components/layout/bottom-nav";
import { ComposerCard } from "@/app/components/feed/composer-card";
import { SectionDivider } from "@/app/components/feed/section-divider";
import { PostCard } from "@/app/components/feed/post-card";
import { POSTS, ROOM, USER } from "@/app/lib/data";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <BottomNav />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-[34px] sm:px-10 lg:pb-20">
          <div className="mb-6">
            <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-rojo">
              {ROOM.label}
            </div>
            <h1 className="m-0 font-display text-[30px] font-semibold text-tinta">
              Buenas, {USER.name.split(" ")[0]}
            </h1>
            <p className="m-0 mt-[5px] text-[14.5px] text-gris-oscuro">
              {ROOM.childrenCount} niños · {ROOM.date}
            </p>
          </div>

          <ComposerCard />
          <SectionDivider />

          <div className="flex flex-col gap-4">
            {POSTS.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
