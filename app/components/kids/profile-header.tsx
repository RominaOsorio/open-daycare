import type { Kid } from "@/app/lib/kids-data";

export function ProfileHeader({ kid }: { kid: Kid }) {
  return (
    <div className="flex items-center gap-[18px]">
      <div
        className="flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full font-display text-[34px] font-semibold"
        style={{ background: kid.avatarBg, color: kid.avatarColor }}
      >
        {kid.initial}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="m-0 font-display text-[28px] font-semibold text-tinta">
          {kid.name}
        </h1>
        <p className="m-0 mt-[3px] text-[15px] text-gris-oscuro">
          {kid.age} años · Sala {kid.roomName}
        </p>
      </div>
      <a
        href="#"
        className="flex-none rounded-xl border-[1.5px] border-borde bg-tarjeta px-4 py-[9px] text-sm font-bold text-tinta-suave"
      >
        Editar
      </a>
    </div>
  );
}
