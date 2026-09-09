"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddKidModal } from "@/app/components/kids/add-kid-modal";
import { KidsGrid } from "@/app/components/kids/kids-grid";
import { PlusIcon } from "@/app/components/icons";
import {
  toIsoDate,
  todayIso,
  type Kid,
  type NewKidInput,
  type Room,
} from "@/app/lib/kids-data";
import { createClient } from "@/utils/supabase/client";

export function KidsManager({
  rooms,
  initialKids,
}: {
  rooms: Room[];
  initialKids: Kid[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (input: NewKidInput) => {
    setSaving(true);
    setSaveError(null);
    const birthDate = toIsoDate(input.birthDate);
    const supabase = createClient();
    const { error } = await supabase.from("children").insert({
      room_id: input.roomId,
      full_name: input.name,
      birth_date: birthDate,
      enrolled_at: todayIso(),
      allergy_tags: input.allergyTags,
      medical_notes: input.notes || null,
      photo_consent: true,
    });
    setSaving(false);
    if (error) {
      setSaveError("No se pudo guardar el niño. Intentá de nuevo.");
      return;
    }
    setModalOpen(false);
    router.refresh();
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
      <KidsGrid kids={initialKids} rooms={rooms} />
      <AddKidModal
        open={modalOpen}
        rooms={rooms}
        saving={saving}
        error={saveError}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
