"use client";

import { useState } from "react";
import { AddKidModal } from "@/app/components/kids/add-kid-modal";
import { KidsGrid } from "@/app/components/kids/kids-grid";
import { PlusIcon } from "@/app/components/icons";
import { KIDS, type Kid } from "@/app/lib/kids";

export function KidsManager() {
  const [kids, setKids] = useState<Kid[]>(KIDS);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSave = (kid: Kid) => {
    setKids((current) => [...current, kid]);
    setModalOpen(false);
  };

  return (
    <>
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-rojo">
            GESTIÓN
          </div>
          <h1 className="m-0 font-display text-[30px] font-semibold text-tinta">
            Niños
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
        >
          <PlusIcon className="h-[17px] w-[17px]" />
          Agregar niño
        </button>
      </div>
      <KidsGrid
        kids={kids}
        navigableSlugs={KIDS.map((kid) => kid.slug)}
      />
      <AddKidModal
        open={modalOpen}
        existingSlugs={kids.map((kid) => kid.slug)}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
