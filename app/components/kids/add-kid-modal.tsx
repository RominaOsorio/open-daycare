"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDownIcon } from "@/app/components/icons";
import { birthDateError } from "@/app/lib/kids";
import {
  parseAllergies,
  type NewKidInput,
  type Room,
} from "@/app/lib/kids-data";

interface AddKidModalProps {
  open: boolean;
  rooms: Room[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: NewKidInput) => void;
}

const labelClass =
  "mb-2 text-xs font-extrabold tracking-[.7px] text-gris-oscuro";

const inputClass =
  "w-full rounded-[14px] border-[1.5px] border-borde-input bg-white px-4 py-[13px] text-[15px] text-tinta placeholder:text-[#b6a99b] focus:outline-none";

export function AddKidModal({
  open,
  rooms,
  saving,
  error,
  onClose,
  onSave,
}: AddKidModalProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [roomId, setRoomId] = useState(() => rooms[0]?.id ?? "");
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");

  const reset = useCallback(() => {
    setName("");
    setBirthDate("");
    setRoomId(rooms[0]?.id ?? "");
    setAllergies("");
    setNotes("");
  }, [rooms]);

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

  const dateFilled = birthDate.trim().length > 0;
  const dateError = dateFilled ? birthDateError(birthDate) : null;
  const selectedRoomId = roomId || rooms[0]?.id || "";
  const valid =
    name.trim().length > 0 && dateFilled && dateError === null && selectedRoomId !== "";

  const handleSave = () => {
    if (!valid || saving) return;
    const { tags, extra } = parseAllergies(allergies);
    const finalNotes = extra.length
      ? notes.trim()
        ? `${notes.trim()}\nAlergias: ${extra.join(", ")}`
        : `Alergias: ${extra.join(", ")}`
      : notes.trim();
    onSave({
      name,
      birthDate,
      roomId: selectedRoomId,
      allergyTags: tags,
      notes: finalNotes,
    });
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(63,54,46,.4)] px-6 py-10"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Agregar niño"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[520px] overflow-hidden rounded-3xl border border-borde bg-crema-suave shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
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
            Agregar niño
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={!valid || saving}
            className={
              valid && !saving
                ? "text-[15px] font-extrabold text-rojo-oscuro"
                : "cursor-not-allowed text-[15px] font-extrabold text-[#c9bcac]"
            }
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>

        <div className="px-[26px] py-6">
          <div className={labelClass}>NOMBRE COMPLETO</div>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Martina López"
            className={`${inputClass} mb-[18px]`}
          />

          <div className="mb-[18px] flex gap-3.5">
            <div className="flex-1">
              <div className={labelClass}>FECHA DE NACIMIENTO</div>
              <input
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                placeholder="dd/mm/aaaa"
                aria-invalid={dateError ? true : undefined}
                className={inputClass}
              />
              {dateError && (
                <p className="mt-1.5 text-[12px] font-bold leading-snug text-rojo-oscuro">
                  {dateError}
                </p>
              )}
            </div>
            <div className="flex-1">
              <div className={labelClass}>SALA</div>
              <div className="relative">
                <select
                  value={selectedRoomId}
                  onChange={(event) => setRoomId(event.target.value)}
                  className={`${inputClass} appearance-none pr-10 font-bold`}
                >
                  {rooms.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b0a290]" />
              </div>
            </div>
          </div>

          <div className={labelClass}>ALERGIAS (ETIQUETAS)</div>
          <input
            value={allergies}
            onChange={(event) => setAllergies(event.target.value)}
            placeholder="Ej. Maní, Lactosa"
            className={`${inputClass} mb-[18px]`}
          />

          <div className={labelClass}>NOTAS MÉDICAS</div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Indicaciones, medicación, contactos…"
            className={`${inputClass} min-h-[90px] resize-y leading-[1.5]`}
          />
          {error && (
            <p className="mt-3 text-[12px] font-bold leading-snug text-rojo-oscuro">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
