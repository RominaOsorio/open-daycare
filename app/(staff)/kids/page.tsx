import { cookies } from "next/headers";
import { KidsManager } from "@/app/components/kids/kids-manager";
import { requireStaff } from "@/app/lib/dal";
import {
  mapChildRow,
  sortRooms,
  type ChildRow,
  type Room,
} from "@/app/lib/kids-data";
import { createClient } from "@/utils/supabase/server";

export default async function KidsPage() {
  await requireStaff();
  const supabase = createClient(await cookies());
  const [roomsRes, childrenRes] = await Promise.all([
    supabase.from("rooms").select("id, name"),
    supabase
      .from("children")
      .select(
        "id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, status, room_id",
      )
      .eq("status", "active")
      .order("full_name"),
  ]);

  const rooms = sortRooms((roomsRes.data ?? []) as Room[]);
  const roomNameById = new Map(rooms.map((room) => [room.id, room.name]));
  const kids = ((childrenRes.data ?? []) as ChildRow[]).map((row, index) =>
    mapChildRow(row, roomNameById.get(row.room_id) ?? "", index),
  );

  return (
    <div className="mx-auto w-full max-w-[880px] px-5 pb-24 pt-[34px] sm:px-10 lg:pb-20">
      <KidsManager rooms={rooms} initialKids={kids} />
    </div>
  );
}
