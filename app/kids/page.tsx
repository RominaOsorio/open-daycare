import { Sidebar } from "@/app/components/layout/sidebar";
import { BottomNav } from "@/app/components/layout/bottom-nav";
import { KidsManager } from "@/app/components/kids/kids-manager";

export default function KidsPage() {
  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <BottomNav />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[880px] px-5 pb-24 pt-[34px] sm:px-10 lg:pb-20">
          <KidsManager />
        </div>
      </main>
    </div>
  );
}
