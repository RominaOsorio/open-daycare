"use client";

import { Avatar } from "@/app/components/ui/avatar";
import { CameraIcon } from "@/app/components/icons";
import { useCreatePost } from "@/app/components/feed/create-post-provider";
import { useUser } from "@/app/components/user/user-provider";
import { USER } from "@/app/lib/data";

export function ComposerCard() {
  const { openModal } = useCreatePost();
  const { profile } = useUser();

  const name = profile?.full_name ?? USER.name;
  const initial = name.trim().charAt(0).toUpperCase() || USER.initial;

  return (
    <button
      type="button"
      onClick={openModal}
      className="mb-6 flex w-full items-center gap-3.5 rounded-[18px] border border-borde bg-tarjeta px-[18px] py-3.5 text-left shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
    >
      <Avatar
        author={{
          name,
          initial,
          avatarBg: USER.avatarBg,
          avatarColor: USER.avatarColor,
        }}
        className="h-10 w-10 font-display text-base font-semibold"
      />
      <span className="flex-1 text-[15px] text-gris">
        Compartí un momento…
      </span>
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-coral-claro text-naranja">
        <CameraIcon className="h-[19px] w-[19px]" />
      </span>
    </button>
  );
}
