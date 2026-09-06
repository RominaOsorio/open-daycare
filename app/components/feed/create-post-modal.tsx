"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageIcon, PlusIcon } from "@/app/components/icons";
import {
  audienceLabel,
  nowTime,
  type Post,
  type PostType,
  USER,
} from "@/app/lib/data";
import { KIDS } from "@/app/lib/kids";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onPublish: (post: Post) => void;
}

const labelClass =
  "mb-2.5 text-xs font-extrabold tracking-[.7px] text-gris-oscuro";

const kidChipClass =
  "flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-sm font-bold";

const typeChipClass =
  "rounded-full border-[1.5px] py-2 px-4 text-[13.5px] font-extrabold";

const POST_TYPES: Array<{ type: PostType; label: string; color: string }> = [
  { type: "comida", label: "Comida", color: "bg-[#9A7B1E] text-white" },
  { type: "siesta", label: "Siesta", color: "bg-[#E7DCF6] text-[#7B5FC0]" },
  { type: "actividad", label: "Actividad", color: "bg-[#2E89A6] text-white" },
  { type: "logro", label: "Logro", color: "bg-[#CFEBD8] text-[#3E9B6C]" },
  { type: "animo", label: "Ánimo", color: "bg-[#F9D2DE] text-[#C56486]" },
  { type: "foto", label: "Foto", color: "bg-[#FBD8CC] text-[#D9684A]" },
  { type: "anuncio", label: "Anuncio", color: "bg-[#CCD8F4] text-[#4E72C8]" },
];

export function CreatePostModal({
  open,
  onClose,
  onPublish,
}: CreatePostModalProps) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [wholeRoom, setWholeRoom] = useState(false);
  const [type, setType] = useState<PostType | null>(null);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(false);

  const reset = useCallback(() => {
    setSelectedSlugs([]);
    setWholeRoom(false);
    setType(null);
    setText("");
    setPhoto(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  if (!open) return null;

  const toggleKid = (slug: string) => {
    const isRemoving = selectedSlugs.includes(slug);
    if (!isRemoving) setWholeRoom(false);
    setSelectedSlugs((current) =>
      isRemoving
        ? current.filter((s) => s !== slug)
        : [...current, slug],
    );
  };

  const selectedKids = KIDS.filter((kid) => selectedSlugs.includes(kid.slug));
  const valid =
    (selectedSlugs.length > 0 || wholeRoom) && type !== null && text.trim().length > 0;

  const handlePublish = () => {
    if (!valid || type === null) return;
    const post: Post = {
      id: String(Date.now()),
      author: USER,
      time: nowTime(),
      type,
      audience: audienceLabel(selectedKids, wholeRoom),
      text: text.trim(),
      photo: photo ? { label: "Foto" } : undefined,
      likes: 0,
      comments: 0,
    };
    reset();
    onPublish(post);
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,.4)] px-6 py-10"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nueva publicación"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[580px] overflow-hidden rounded-3xl border border-borde bg-crema-suave shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
      >
        <div className="flex items-center justify-between border-b border-borde px-[26px] py-5">
          <button
            type="button"
            onClick={handleClose}
            className="text-[15px] font-bold text-gris-oscuro"
          >
            Cancelar
          </button>
          <span className="font-display text-lg font-semibold text-tinta">
            Nueva publicación
          </span>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!valid}
            className="text-[15px] font-extrabold text-rojo disabled:cursor-not-allowed disabled:opacity-55"
          >
            Publicar
          </button>
        </div>

        <div className="px-[26px] py-6">
          <div className={labelClass}>PARA</div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {KIDS.map((kid) => {
              const selected = selectedSlugs.includes(kid.slug);
              return (
                <button
                  key={kid.slug}
                  type="button"
                  onClick={() => toggleKid(kid.slug)}
                  className={`${kidChipClass} ${
                    selected
                      ? "border-[1.5px] border-tinta bg-tinta text-white"
                      : "border-[1.5px] border-borde bg-tarjeta text-[#6E6359]"
                  }`}
                >
                  <span
                    className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full font-display text-[13px] font-semibold"
                    style={{
                      background: kid.avatarBg,
                      color: kid.avatarColor,
                    }}
                  >
                    {kid.initial}
                  </span>
                  {kid.name.split(" ")[0]}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() =>
                setWholeRoom((current) => {
                  if (!current) setSelectedSlugs([]);
                  return !current;
                })
              }
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                wholeRoom || selectedSlugs.length === KIDS.length
                  ? "border-[1.5px] border-tinta bg-tinta text-white"
                  : "border-[1.5px] border-borde bg-tarjeta text-[#6E6359]"
              }`}
            >
              Toda la sala
            </button>
          </div>

          <div className={labelClass}>TIPO</div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {POST_TYPES.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => setType(option.type)}
                className={`${typeChipClass} ${option.color} ${
                  type === option.type ? "border-tinta" : "border-transparent"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className={labelClass}>DESCRIPCIÓN</div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Contá cómo le fue hoy…"
            className="mb-[22px] min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] border-borde-input bg-white px-4 py-3.5 text-[15px] leading-[1.5] text-tinta placeholder:text-[#b6a99b] focus:outline-none"
          />

          <div className={labelClass}>FOTOS</div>
          <div className="flex gap-3">
            {photo && (
              <div className="flex h-24 w-24 flex-none items-center justify-center rounded-[14px] border border-borde bg-foto-fondo text-[#CBB89F]">
                <ImageIcon className="h-[26px] w-[26px]" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setPhoto(true)}
              className="flex h-24 w-24 flex-none flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-foto-borde bg-foto-fondo text-foto-texto"
            >
              <span className="text-rojo-oscuro">
                <PlusIcon className="h-[22px] w-[22px]" />
              </span>
              <span className="text-xs">Agregar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
