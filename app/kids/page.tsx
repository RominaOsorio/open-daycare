import { Sidebar } from "@/app/components/layout/sidebar";
import { BottomNav } from "@/app/components/layout/bottom-nav";
import { KidsGrid } from "@/app/components/kids/kids-grid";
import { PlusIcon } from "@/app/components/icons";
import { KIDS } from "@/app/lib/kids";

export default function KidsPage() {
  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <BottomNav />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[880px] px-5 pb-24 pt-[34px] sm:px-10 lg:pb-20">
          <div className="mb-[22px] flex items-end justify-between gap-4">
            <div>
              <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-rojo">
                GESTIÓN
              </div>
              <h1 className="m-0 font-display text-[30px] font-semibold text-tinta">
                Niños
              </h1>
            </div>
            <a
              href="#"
              className="flex items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
            >
              <PlusIcon className="h-[17px] w-[17px]" />
              Agregar niño
            </a>
          </div>
          <KidsGrid kids={KIDS} />
        </div>
      </main>
    </div>
  );
}
