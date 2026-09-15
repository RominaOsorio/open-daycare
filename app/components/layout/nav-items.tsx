import {
  HomeIcon,
  KidsIcon,
  BellIcon,
  UserIcon,
  SunIcon,
} from "@/app/components/icons";
import type { ComponentType } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export const STAFF_NAV_ITEMS: NavItem[] = [
  { label: "Feed", href: "/", icon: HomeIcon },
  { label: "Niños", href: "/kids", icon: KidsIcon },
  { label: "Avisos", href: "#", icon: BellIcon },
  { label: "Mi cuenta", href: "#", icon: UserIcon },
];

export const FAMILY_NAV_ITEMS: NavItem[] = [
  { label: "Feed", href: "/familia", icon: HomeIcon },
  { label: "Resumen del día", href: "#", icon: SunIcon },
  { label: "Mi cuenta", href: "#", icon: UserIcon },
];
