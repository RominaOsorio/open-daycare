import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/app/components/layout/sidebar";
import { BottomNav } from "@/app/components/layout/bottom-nav";
import { ProfileHeader } from "@/app/components/kids/profile-header";
import { AllergyBox } from "@/app/components/kids/allergy-box";
import { KidInfoCard } from "@/app/components/kids/kid-info-card";
import { ParentsCard } from "@/app/components/kids/parents-card";
import { ChevronLeftIcon, SunIcon } from "@/app/components/icons";
import { mapChildRow, type ChildRow, type Room } from "@/app/lib/kids-data";
import { createClient } from "@/utils/supabase/server";

export default async function KidProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient(await cookies());

  const { data: child } = await supabase
    .from("children")
    .select(
      "id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, status, room_id",
    )
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  if (!child) notFound();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("id", child.room_id)
    .maybeSingle();

  const kid = mapChildRow(child as ChildRow, (room as Room)?.name ?? "", 0);

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <BottomNav />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[820px] px-5 pb-24 pt-[34px] sm:px-10 lg:pb-20">
          <Link
            href="/kids"
            className="mb-5 flex items-center gap-1.5 text-sm font-bold text-gris-oscuro"
          >
            <ChevronLeftIcon className="h-[18px] w-[18px]" />
            Volver a Niños
          </Link>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-[26px]">
            <div className="flex min-w-0 flex-1 flex-col gap-[18px]">
              <ProfileHeader kid={kid} />
              {kid.notes && <AllergyBox kid={kid} />}
              <KidInfoCard kid={kid} />
            </div>
            <div className="flex w-full max-w-[300px] flex-col gap-3.5 lg:w-[300px] lg:flex-none">
              <a
                href="#"
                className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-tinta py-[13px] text-[15px] font-extrabold text-white"
              >
                <SunIcon className="h-[18px] w-[18px]" />
                Resumen del día
              </a>
              <ParentsCard kidName={kid.name} initialParents={[]} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
