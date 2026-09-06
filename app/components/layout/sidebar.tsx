import { NAV_ITEMS } from "@/app/components/layout/nav-items";
import { Avatar } from "@/app/components/ui/avatar";
import { LogoutIcon, PlusIcon, SunIcon } from "@/app/components/icons";
import { ROOM, USER } from "@/app/lib/data";

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-borde bg-tarjeta px-4 py-6 lg:flex">
      <a href="#" className="flex items-center gap-2.5 px-2 pb-[22px] pt-1">
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C3A8] to-[#F2937A]">
          <SunIcon className="h-[21px] w-[21px]" />
        </div>
        <div>
          <div className="font-display text-[17px] font-semibold leading-none text-tinta">
            OpenDayCare
          </div>
          <div className="mt-0.5 text-[11.5px] text-gris">{ROOM.name}</div>
        </div>
      </a>

      <a
        href="#"
        className="mb-4.5 flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
      >
        <PlusIcon className="h-[17px] w-[17px]" />
        Nueva publicación
      </a>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const active = index === 0;
          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${
                active
                  ? "bg-coral-claro font-extrabold text-rojo"
                  : "font-semibold text-tinta-suave"
              }`}
            >
              <Icon className="h-[19px] w-[19px]" />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-2.5 border-t border-borde pt-3.5">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <Avatar
            author={{ name: USER.name, initial: USER.initial, avatarBg: USER.avatarBg, avatarColor: USER.avatarColor }}
            className="h-[38px] w-[38px] font-display text-base font-semibold"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-tinta">{USER.name}</div>
            <div className="text-xs text-gris">{USER.role}</div>
          </div>
          <a
            href="#"
            title="Cerrar sesión"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-crema text-gris-oscuro"
          >
            <LogoutIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </aside>
  );
}
