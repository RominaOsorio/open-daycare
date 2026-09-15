"use client";

import { usePathname } from "next/navigation";
import {
  FAMILY_NAV_ITEMS,
  STAFF_NAV_ITEMS,
} from "@/app/components/layout/nav-items";

export function BottomNav({ variant }: { variant: "staff" | "family" }) {
  const pathname = usePathname();
  const items = variant === "staff" ? STAFF_NAV_ITEMS : FAMILY_NAV_ITEMS;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-borde bg-tarjeta lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <a
            key={item.label}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${
              active ? "font-extrabold text-rojo" : "font-semibold text-gris-oscuro"
            }`}
          >
            <Icon className="h-[21px] w-[21px]" />
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
