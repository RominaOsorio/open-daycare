"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { ImageIcon, PlusIcon, XIcon } from "@/app/components/icons";
import { createPost } from "@/app/actions/posts";
import { preparePhoto, type PreparedPhoto } from "@/app/lib/image";
import { POST_TYPE_TO_DB, type PostType } from "@/app/lib/posts";
import type { ChildOption, RoomOption } from "@/app/lib/posts";

interface CreatePostModalProps {
  onClose: () => void;
  rooms: RoomOption[];
  childrenByRoom: Record<string, ChildOption[]>;
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

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface SelectedPhoto extends PreparedPhoto {
  key: string;
}

export function CreatePostModal({
  onClose,
  rooms,
  childrenByRoom,
}: CreatePostModalProps) {
  const [roomId, setRoomId] = useState(() =>
    rooms.length === 1 ? rooms[0].id : "",
  );
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [wholeRoom, setWholeRoom] = useState(false);
  const [type, setType] = useState<PostType | null>(null);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<SelectedPhoto[]>([]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(
    () => () => {
      photosRef.current.forEach((photo) =>
        URL.revokeObjectURL(photo.previewUrl),
      );
    },
    [],
  );

  const handleClose = useCallback(() => {
    if (pending) return;
    onClose();
  }, [pending, onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const roomChildren = roomId ? childrenByRoom[roomId] ?? [] : [];
  const photosAttached = photos.length > 0;
  const wholeRoomSelected =
    roomChildren.length > 0 &&
    (wholeRoom || selectedChildIds.length === roomChildren.length);
  const excludedCount = photosAttached
    ? roomChildren.filter((child) => !child.photoConsent).length
    : 0;

  const toggleKid = (id: string) => {
    setWholeRoom(false);
    setSelectedChildIds((current) =>
      current.includes(id)
        ? current.filter((childId) => childId !== id)
        : [...current, id],
    );
  };

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setError(null);

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      setError(`Podés adjuntar hasta ${MAX_PHOTOS} fotos.`);
      return;
    }

    const accepted: File[] = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Solo se permiten imágenes JPG, PNG o WEBP.");
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setError("Cada foto puede pesar hasta 5 MB.");
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    const toAdd = accepted.slice(0, remaining);
    if (accepted.length > remaining) {
      setError(`Podés adjuntar hasta ${MAX_PHOTOS} fotos.`);
    }
    const prepared = await Promise.all(toAdd.map(preparePhoto));
    setPhotos((current) => [
      ...current,
      ...prepared.map((photo, index) => ({
        ...photo,
        key: `${Date.now()}-${index}-${Math.random()}`,
      })),
    ]);
  };

  const removePhoto = (key: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((photo) => photo.key !== key);
    });
  };

  const valid =
    roomId !== "" &&
    (wholeRoom || selectedChildIds.length > 0) &&
    type !== null &&
    text.trim().length > 0 &&
    (type !== "foto" || photosAttached) &&
    !pending;

  const handlePublish = async () => {
    if (!valid || type === null) return;
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("type", POST_TYPE_TO_DB[type]);
    formData.set("roomId", roomId);
    if (wholeRoom) formData.set("wholeRoom", "1");
    if (!wholeRoom) {
      selectedChildIds.forEach((childId) =>
        formData.append("childIds", childId),
      );
    }
    formData.set("body", text.trim());
    photos.forEach((photo, index) => {
      formData.append(
        "photos",
        new File([photo.blob], `foto-${index + 1}.jpg`, {
          type: photo.blob.type || "image/jpeg",
        }),
      );
    });
    formData.set(
      "photoDims",
      JSON.stringify(
        photos.map((photo) => ({
          width: photo.width,
          height: photo.height,
        })),
      ),
    );

    const result = await createPost(formData);
    if (!result.ok) {
      setError(result.error ?? "No pudimos publicar. Intentá de nuevo.");
      setPending(false);
      return;
    }
    onClose();
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
            disabled={pending}
            className="text-[15px] font-bold text-gris-oscuro disabled:opacity-55"
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
            {pending ? "Publicando…" : "Publicar"}
          </button>
        </div>

        <div className="px-[26px] py-6">
          {rooms.length > 1 && (
            <>
              <div className={labelClass}>SALA</div>
              <div className="mb-[22px] flex flex-wrap gap-[9px]">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => {
                      setRoomId(room.id);
                      setSelectedChildIds([]);
                      setWholeRoom(false);
                    }}
                    className={`rounded-full border-[1.5px] px-4 py-2 text-[13.5px] font-extrabold ${
                      roomId === room.id
                        ? "border-tinta bg-tinta text-white"
                        : "border-borde bg-tarjeta text-[#6E6359]"
                    }`}
                  >
                    {room.name}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className={labelClass}>PARA</div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {roomChildren.map((child) => {
              const selected = selectedChildIds.includes(child.id);
              const disabled = photosAttached && !child.photoConsent;
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => toggleKid(child.id)}
                  disabled={disabled}
                  title={
                    disabled
                      ? "No autorizó fotos: no se puede etiquetar con imágenes"
                      : undefined
                  }
                  className={`${kidChipClass} ${
                    disabled
                      ? "cursor-not-allowed border-[1.5px] border-borde bg-crema opacity-50"
                      : selected
                        ? "border-[1.5px] border-tinta bg-tinta text-white"
                        : "border-[1.5px] border-borde bg-tarjeta text-[#6E6359]"
                  }`}
                >
                  <span
                    className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full font-display text-[13px] font-semibold"
                    style={{
                      background: child.avatarBg,
                      color: child.avatarColor,
                    }}
                  >
                    {child.initial}
                  </span>
                  {child.name.split(" ")[0]}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() =>
                setWholeRoom((current) => {
                  if (!current) setSelectedChildIds([]);
                  return !current;
                })
              }
              disabled={roomChildren.length === 0}
              className={`rounded-full px-4 py-1.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
                wholeRoomSelected
                  ? "border-[1.5px] border-tinta bg-tinta text-white"
                  : "border-[1.5px] border-borde bg-tarjeta text-[#6E6359]"
              }`}
            >
              Toda la sala
            </button>
          </div>

          {roomId === "" && (
            <p className="mb-[22px] -mt-3 text-[13px] text-gris">
              Elegí una sala para ver a los niños.
            </p>
          )}

          {photosAttached && excludedCount > 0 && wholeRoom && (
            <p className="mb-[22px] -mt-3 text-[13px] font-bold text-naranja">
              {excludedCount === 1
                ? "1 familia no autorizó fotos: no verá esta publicación."
                : `${excludedCount} familias no autorizaron fotos: no verán esta publicación.`}
            </p>
          )}

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
            maxLength={2000}
            placeholder="Contá cómo le fue hoy…"
            className="mb-[22px] min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] border-borde-input bg-white px-4 py-3.5 text-[15px] leading-[1.5] text-tinta placeholder:text-[#b6a99b] focus:outline-none"
          />

          <div className={labelClass}>
            FOTOS{photos.length > 0 ? ` · ${photos.length}/${MAX_PHOTOS}` : ""}
          </div>
          <div className="flex flex-wrap gap-3">
            {photos.map((photo) => (
              <div key={photo.key} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt="Foto seleccionada"
                  className="h-24 w-24 flex-none rounded-[14px] border border-borde object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.key)}
                  title="Quitar foto"
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-tinta text-white"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-24 flex-none flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-foto-borde bg-foto-fondo text-foto-texto"
              >
                <span className="text-rojo-oscuro">
                  <PlusIcon className="h-[22px] w-[22px]" />
                </span>
                <span className="text-xs">Agregar</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
          {photosAttached && (
            <p className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-gris">
              <ImageIcon className="h-4 w-4" />
              Los chips apagados no autorizaron fotos y no se pueden etiquetar
              con imágenes.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-[12px] bg-etiqueta-rosa px-4 py-3 text-[13.5px] font-bold text-etiqueta-rosa-texto">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
