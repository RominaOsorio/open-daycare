import { cache } from "react";
import { cookies } from "next/headers";
import { AVATAR_PALETTE, sortRooms, type Room } from "@/app/lib/kids-data";
import type { ChildOption, RoomOption } from "@/app/lib/posts";
import { createClient } from "@/utils/supabase/server";

interface ChildRow {
  id: string;
  full_name: string;
  room_id: string;
  photo_consent: boolean;
}

export interface ComposerData {
  rooms: RoomOption[];
  childrenByRoom: Record<string, ChildOption[]>;
  childrenCount: number;
}

export const getComposerData = cache(async (): Promise<ComposerData> => {
  const supabase = createClient(await cookies());
  const [roomsRes, childrenRes] = await Promise.all([
    supabase.from("rooms").select("id, name"),
    supabase
      .from("children")
      .select("id, full_name, room_id, photo_consent")
      .eq("status", "active")
      .order("full_name"),
  ]);

  const rooms = sortRooms((roomsRes.data ?? []) as Room[]).map((room) => ({
    id: room.id,
    name: room.name,
  }));

  const children = (childrenRes.data ?? []) as ChildRow[];
  const childrenByRoom: Record<string, ChildOption[]> = {};
  children.forEach((child, index) => {
    const palette = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
    const bucket = childrenByRoom[child.room_id] ?? [];
    bucket.push({
      id: child.id,
      name: child.full_name,
      initial: child.full_name.trim().charAt(0).toUpperCase(),
      avatarBg: palette.bg,
      avatarColor: palette.color,
      photoConsent: child.photo_consent,
    });
    childrenByRoom[child.room_id] = bucket;
  });

  return { rooms, childrenByRoom, childrenCount: children.length };
});
