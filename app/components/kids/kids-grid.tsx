"use client";

import { useState } from "react";
import { SearchIcon } from "@/app/components/icons";
import { KidCard } from "@/app/components/kids/kid-card";
import type { Kid } from "@/app/lib/kids";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function KidsGrid({ kids }: { kids: Kid[] }) {
  const [query, setQuery] = useState("");
  const filtered = kids.filter((kid) =>
    normalize(kid.name).includes(normalize(query)),
  );

  return (
    <div>
      <div className="mb-[22px] flex items-center gap-2.5 rounded-[14px] border border-borde bg-tarjeta px-4 py-3">
        <SearchIcon className="h-[18px] w-[18px] flex-none text-[#b0a290]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar niño…"
          className="w-full flex-1 border-none bg-transparent text-[15px] text-tinta placeholder:text-[#b6a99b] focus:outline-none"
        />
      </div>
      <div className="mb-3.5 flex items-center gap-3">
        <span className="text-[12.5px] font-extrabold tracking-[.8px] text-tinta">
          SALA SOLES
        </span>
        <span className="text-[13px] text-gris">{kids.length} niños</span>
        <span className="h-px flex-1 bg-divisor" />
      </div>
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {filtered.map((kid) => (
          <KidCard key={kid.slug} kid={kid} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-6 text-center text-sm text-gris">
          No se encontraron niños.
        </p>
      )}
    </div>
  );
}
