import type { Kid } from "@/app/lib/kids-data";

export function KidInfoCard({ kid }: { kid: Kid }) {
  const rows: [string, string][] = [
    ["Fecha de nacimiento", kid.birthDate],
    ["Sala", kid.roomName],
    ["Ingreso", kid.entryDate],
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-borde bg-tarjeta">
      {rows.map(([label, value], index) => (
        <div
          key={label}
          className={`flex items-center justify-between px-[18px] py-[15px] ${
            index < rows.length - 1 ? "border-b border-borde-claro" : ""
          }`}
        >
          <span className="text-[14.5px] text-gris-oscuro">{label}</span>
          <span className="text-[14.5px] font-extrabold text-tinta">{value}</span>
        </div>
      ))}
    </div>
  );
}
