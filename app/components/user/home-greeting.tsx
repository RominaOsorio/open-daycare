"use client";

import { useUser } from "@/app/components/user/user-provider";

export function HomeGreeting() {
  const { profile, loading } = useUser();
  const firstName = profile?.full_name.split(" ")[0];

  return (
    <h1 className="m-0 font-display text-[30px] font-semibold text-tinta">
      Buenas, {loading ? "…" : firstName}
    </h1>
  );
}
