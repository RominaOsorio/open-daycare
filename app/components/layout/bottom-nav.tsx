import { NAV_ITEMS } from "@/app/components/layout/nav-items";

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-borde bg-tarjeta lg:hidden">
      {NAV_ITEMS.map((item, index) => {
        const Icon = item.icon;
        const active = index === 0;
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
