import type { PostType } from "@/app/lib/data";

const TYPES: Record<
  PostType,
  { label: string; badge: string; dot: string; text: string }
> = {
  logro: {
    label: "LOGRO",
    badge: "bg-verde-claro",
    dot: "bg-verde",
    text: "text-verde",
  },
  actividad: {
    label: "ACTIVIDAD",
    badge: "bg-celeste-claro",
    dot: "bg-celeste",
    text: "text-celeste",
  },
  anuncio: {
    label: "ANUNCIO",
    badge: "bg-azul-claro",
    dot: "bg-azul",
    text: "text-azul",
  },
};

export function Tag({ type }: { type: PostType }) {
  const t = TYPES[type];
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${t.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${t.dot}`} />
      <span className={`text-xs font-extrabold tracking-wide ${t.text}`}>
        {t.label}
      </span>
    </span>
  );
}
