import { AlertIcon } from "@/app/components/icons";
import type { Kid } from "@/app/lib/kids";

export function AllergyBox({ kid }: { kid: Kid }) {
  return (
    <div className="flex gap-3.5 rounded-2xl bg-alerta px-[18px] py-4">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-alerta-icono">
        <AlertIcon className="h-[22px] w-[22px]" />
      </div>
      <div>
        <div className="mb-0.5 text-[15px] font-extrabold text-alerta-texto">
          Alergias y notas
        </div>
        <div className="text-[14.5px] leading-relaxed text-alerta-suave">
          {kid.notes}
        </div>
      </div>
    </div>
  );
}
