import Link from "next/link";
import type { Kid } from "@/app/lib/kids-data";

export function KidCard({ kid }: { kid: Kid }) {
  return (
    <Link
      href={`/kids/${kid.id}`}
      className="flex items-center gap-3.5 rounded-[18px] border border-borde bg-tarjeta p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)] transition hover:-translate-y-0.5 hover:border-[#f2a78e]"
    >
      <div
        className="flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
        style={{ background: kid.avatarBg, color: kid.avatarColor }}
      >
        {kid.initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-extrabold text-tinta">{kid.name}</div>
        <div className="text-[13px] text-gris">
          {kid.age} años · sin padres vinculados
        </div>
      </div>
      {kid.allergy ? (
        <span className="flex-none rounded-full bg-etiqueta-coral px-2 py-[5px] text-[11px] font-extrabold text-etiqueta-coral-texto">
          {kid.allergy}
        </span>
      ) : (
        <span className="flex-none rounded-full bg-etiqueta-rosa px-2 py-[5px] text-[11px] font-extrabold text-etiqueta-rosa-texto">
          VINCULAR
        </span>
      )}
    </Link>
  );
}
