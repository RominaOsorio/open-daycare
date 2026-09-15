import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export interface Profile {
  id: string;
  full_name: string;
  role: "staff" | "parent" | "admin";
  avatar_url: string | null;
  daycare_id: string | null;
  daycare_name: string | null;
}

interface ProfileRow {
  id: string;
  full_name: string;
  role: "staff" | "parent" | "admin";
  avatar_url: string | null;
  daycare_id: string | null;
  daycares: { name: string } | { name: string }[] | null;
}

function embeddedOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, full_name, role, avatar_url, daycare_id, daycares(name)")
    .eq("id", user.id)
    .single();
  if (!data) return null;

  const row = data as unknown as ProfileRow;
  return {
    id: row.id,
    full_name: row.full_name,
    role: row.role,
    avatar_url: row.avatar_url,
    daycare_id: row.daycare_id,
    daycare_name: embeddedOne(row.daycares)?.name ?? null,
  };
});

export async function requireStaff(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) notFound();
  if (profile.role === "parent") redirect("/familia");
  return profile;
}

export async function requireParent(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) notFound();
  if (profile.role !== "parent") redirect("/");
  return profile;
}
