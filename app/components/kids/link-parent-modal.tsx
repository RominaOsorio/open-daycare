"use client";

import { useCallback, useEffect, useState } from "react";
import { InfoIcon, SendIcon, XIcon } from "@/app/components/icons";
import {
  buildParent,
  generateInviteCode,
  isValidEmail,
  RELATIONS,
  type ParentLink,
  type Relation,
} from "@/app/lib/kids";

interface LinkParentModalProps {
  open: boolean;
  kidName: string;
  existingParents: ParentLink[];
  onClose: () => void;
  onSend: (parent: ParentLink) => void;
}

const labelClass =
  "mb-2 text-xs font-extrabold tracking-[.7px] text-gris-oscuro";

const inputClass =
  "w-full rounded-[14px] border-[1.5px] border-borde-input bg-white px-4 py-[13px] text-[15px] text-tinta placeholder:text-[#b6a99b] focus:outline-none";

const chipClass =
  "flex-1 rounded-full border-[1.5px] py-[11px] text-[14px] font-extrabold";

export function LinkParentModal({
  open,
  kidName,
  existingParents,
  onClose,
  onSend,
}: LinkParentModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState<Relation>("Mamá");
  const [code, setCode] = useState(() => generateInviteCode());

  const reset = useCallback(() => {
    setName("");
    setEmail("");
    setRelation("Mamá");
    setCode(generateInviteCode());
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

  const duplicateEmail = existingParents.some(
    (parent) =>
      parent.email?.toLowerCase() === email.trim().toLowerCase(),
  );
  const valid =
    name.trim().length > 0 && isValidEmail(email) && !duplicateEmail;

  const handleSend = () => {
    if (!valid) return;
    const parent = buildParent(
      { name, email, relation },
      existingParents,
    );
    reset();
    onSend(parent);
  };

  return (
    <div
            onClick={handleClose}
      className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(63,54,46,.4)] px-6 py-10"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Vincular padre"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[480px] overflow-hidden rounded-3xl border border-borde bg-crema-suave shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
      >
        <div className="flex items-center justify-between border-b border-borde px-[26px] py-5">
          <div>
            <div className="font-display text-lg font-semibold text-tinta">
              Vincular padre
            </div>
            <div className="mt-0.5 text-[13px] text-gris">a {kidName}</div>
          </div>
          <button
            type="button"
      onClick={handleClose}
            aria-label="Cerrar"
            className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-[#F0E6D8] text-gris-oscuro"
          >
            <XIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="px-[26px] py-[22px]">
          <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-[13px]">
            <InfoIcon className="mt-px h-5 w-5 flex-none text-[#4E72C8]" />
            <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
              Le enviaremos un correo con un código para que active su cuenta.
              Solo verá el feed de {kidName}.
            </span>
          </div>

          <div className={labelClass}>NOMBRE DEL PADRE/MADRE</div>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Diego Fernández"
            className={`${inputClass} mb-[18px]`}
          />

          <div className={labelClass}>EMAIL</div>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="correo@ejemplo.com"
            aria-invalid={duplicateEmail ? true : undefined}
            className={`${inputClass} mb-[18px]`}
          />
          {duplicateEmail && (
            <p className="-mt-3 mb-[18px] text-[12px] font-bold leading-snug text-rojo-oscuro">
              Este email ya está vinculado a este niño.
            </p>
          )}

          <div className="mb-2.5 text-xs font-extrabold tracking-[.7px] text-gris-oscuro">
            PARENTESCO
          </div>
          <div className="mb-5 flex gap-[9px]">
            {RELATIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRelation(option)}
                className={
                  option === relation
                    ? `${chipClass} border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]`
                    : `${chipClass} border-borde bg-tarjeta text-[#6E6359]`
                }
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mb-5 rounded-2xl border-[1.5px] border-dashed border-[#E6D08A] bg-marfil px-4 py-[18px] text-center">
            <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#A88526]">
              CÓDIGO DE INVITACIÓN
            </div>
            <div className="font-display text-[34px] font-semibold leading-none tracking-[7px] text-marron-invitacion">
              {code}
            </div>
            <div className="mt-1.5 text-[13px] text-[#A88526]">
              Vence en 7 días
            </div>
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!valid}
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
          >
            <SendIcon className="h-[19px] w-[19px]" />
            Enviar invitación
          </button>
        </div>
      </div>
    </div>
  );
}
