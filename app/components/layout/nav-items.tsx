import { HomeIcon, KidsIcon, BellIcon, UserIcon } from "@/app/components/icons";
import type { ComponentType } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Feed", href: "#", icon: HomeIcon },
  { label: "Niños", href: "#", icon: KidsIcon },
  { label: "Avisos", href: "#", icon: BellIcon },
  { label: "Mi cuenta", href: "#", icon: UserIcon },
];
