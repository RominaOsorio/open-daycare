"use client";

import { useState } from "react";
import { LinkParentModal } from "@/app/components/kids/link-parent-modal";
import type { Kid, ParentLink } from "@/app/lib/kids";

function statusLabel(parent: ParentLink) {
  return parent.status === "activo" ? "activa" : "invitación enviada";
}

export function ParentsCard({ kid }: { kid: Kid }) {
  const [parents, setParents] = useState<ParentLink[]>(kid.parents);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSend = (parent: ParentLink) => {
    setParents((current) => [...current, parent]);
    setModalOpen(false);
  };

  return (
    <div className="rounded-2xl border border-borde bg-tarjeta px-[18px] py-4">
      <div className="mb-3.5 text-[12.5px] font-extrabold tracking-[.8px] text-marron">
        PADRES VINCULADOS
      </div>
      <div className="flex flex-col gap-3.5">
        {parents.map((parent) => (
          <div key={parent.name} className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-base font-semibold"
              style={{ background: parent.avatarBg, color: parent.avatarColor }}
            >
              {parent.initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-extrabold text-tinta">
                {parent.name}
              </div>
              <div className="text-[12.5px] text-gris">
                {parent.relation} · {statusLabel(parent)}
              </div>
            </div>
            <span
              className={`flex-none rounded-full px-2 py-1 text-[10.5px] font-extrabold ${
                parent.status === "activo"
                  ? "bg-verde-claro text-verde"
                  : "bg-etiqueta-amarilla text-etiqueta-amarilla-texto"
              }`}
            >
              {parent.status === "activo" ? "ACTIVA" : "PENDIENTE"}
            </span>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex w-full items-center gap-3 pt-2 text-left"
        >
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#d8cbba] text-[#b0a290]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="text-[14.5px] font-extrabold text-rojo-oscuro">
            Vincular otro padre
          </span>
        </button>
      </div>
      <LinkParentModal
        open={modalOpen}
        kidName={kid.name}
        existingParents={parents}
        onClose={() => setModalOpen(false)}
        onSend={handleSend}
      />
    </div>
  );
}
