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
  comida: {
    label: "COMIDA",
    badge: "bg-etiqueta-amarilla",
    dot: "bg-etiqueta-amarilla-texto",
    text: "text-etiqueta-amarilla-texto",
  },
  siesta: {
    label: "SIESTA",
    badge: "bg-violeta-claro",
    dot: "bg-violeta",
    text: "text-violeta",
  },
  animo: {
    label: "ÁNIMO",
    badge: "bg-etiqueta-rosa",
    dot: "bg-etiqueta-rosa-texto",
    text: "text-etiqueta-rosa-texto",
  },
  foto: {
    label: "FOTO",
    badge: "bg-etiqueta-coral",
    dot: "bg-etiqueta-coral-texto",
    text: "text-etiqueta-coral-texto",
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
