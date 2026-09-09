export type ParentStatus = "activo" | "pendiente";

export interface ParentLink {
  name: string;
  relation: string;
  status: ParentStatus;
  initial: string;
  avatarBg: string;
  avatarColor: string;
  email?: string;
}

export interface Kid {
  slug: string;
  name: string;
  initial: string;
  age: number;
  avatarBg: string;
  avatarColor: string;
  allergy?: string;
  birthDate: string;
  room: string;
  entryDate: string;
  notes?: string;
  parents: ParentLink[];
}

export const RELATIONS = ["Mamá", "Papá", "Tutor/a"] as const;
export type Relation = (typeof RELATIONS)[number];

export const PARENT_PALETTE: Array<{ bg: string; color: string }> = [
  { bg: "#C9B6E8", color: "#fff" },
  { bg: "#A9C7E8", color: "#fff" },
  { bg: "#F4B8CC", color: "#fff" },
  { bg: "#B9DEC4", color: "#fff" },
  { bg: "#F4DC8E", color: "#fff" },
  { bg: "#A9D9E8", color: "#fff" },
];

export function parseBirthDate(
  value: string,
): { day: number; month: number; year: number } | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return { day, month, year };
}

export function birthDateError(
  value: string,
  today = new Date(),
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = parseBirthDate(trimmed);
  if (!parsed) return "Fecha inválida. Usá el formato dd/mm/aaaa";
  const birth = new Date(parsed.year, parsed.month - 1, parsed.day);
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  if (birth.getTime() > todayStart.getTime()) {
    return "La fecha no puede ser futura";
  }
  if (ageFrom(parsed, today) > 6) return "La edad debe ser entre 0 y 6 años";
  return null;
}

function ageFrom(
  birth: { day: number; month: number; year: number },
  today: Date,
): number {
  let age = today.getFullYear() - birth.year;
  const beforeBirthday =
    today.getMonth() + 1 < birth.month ||
    (today.getMonth() + 1 === birth.month && today.getDate() < birth.day);
  if (beforeBirthday) age -= 1;
  return age;
}

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 5): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return code;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function buildParent(
  input: { name: string; email: string; relation: Relation },
  existingParents: ParentLink[],
): ParentLink {
  const palette =
    PARENT_PALETTE[existingParents.length % PARENT_PALETTE.length];
  return {
    name: input.name.trim(),
    relation: input.relation,
    status: "pendiente",
    initial: input.name.trim().charAt(0).toUpperCase(),
    avatarBg: palette.bg,
    avatarColor: palette.color,
    email: input.email.trim(),
  };
}

export const KIDS: Kid[] = [
  {
    slug: "mateo-fernandez",
    name: "Mateo Fernández",
    initial: "M",
    age: 3,
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    allergy: "MANÍ",
    birthDate: "12 mar 2022",
    room: "Soles",
    entryDate: "feb 2025",
    notes: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    parents: [
      {
        name: "Lucía Fernández",
        relation: "Mamá",
        status: "activo",
        initial: "L",
        avatarBg: "#C9B6E8",
        avatarColor: "#fff",
      },
      {
        name: "Diego Fernández",
        relation: "Papá",
        status: "pendiente",
        initial: "D",
        avatarBg: "#A9C7E8",
        avatarColor: "#fff",
      },
    ],
  },
  {
    slug: "sofia-mendez",
    name: "Sofía Méndez",
    initial: "S",
    age: 2,
    avatarBg: "#F4B8CC",
    avatarColor: "#C44A7A",
    birthDate: "20 jun 2023",
    room: "Soles",
    entryDate: "mar 2025",
    parents: [
      {
        name: "Carolina Méndez",
        relation: "Mamá",
        status: "activo",
        initial: "C",
        avatarBg: "#F4B8CC",
        avatarColor: "#fff",
      },
    ],
  },
  {
    slug: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    initial: "B",
    age: 3,
    avatarBg: "#B9DEC4",
    avatarColor: "#3E8B62",
    birthDate: "5 may 2022",
    room: "Soles",
    entryDate: "feb 2025",
    parents: [
      {
        name: "Paula Ruiz",
        relation: "Mamá",
        status: "activo",
        initial: "P",
        avatarBg: "#F4DC8E",
        avatarColor: "#fff",
      },
      {
        name: "Martín Ruiz",
        relation: "Papá",
        status: "activo",
        initial: "M",
        avatarBg: "#B9DEC4",
        avatarColor: "#fff",
      },
    ],
  },
  {
    slug: "valentina-soto",
    name: "Valentina Soto",
    initial: "V",
    age: 2,
    avatarBg: "#F4DC8E",
    avatarColor: "#9A7B1E",
    birthDate: "11 abr 2023",
    room: "Soles",
    entryDate: "mar 2025",
    parents: [],
  },
  {
    slug: "tomas-diaz",
    name: "Tomás Díaz",
    initial: "T",
    age: 3,
    avatarBg: "#C9B6E8",
    avatarColor: "#7B5FC0",
    allergy: "LACTOSA",
    birthDate: "2 sep 2022",
    room: "Soles",
    entryDate: "feb 2025",
    parents: [
      {
        name: "Julia Díaz",
        relation: "Mamá",
        status: "activo",
        initial: "J",
        avatarBg: "#A9D9E8",
        avatarColor: "#fff",
      },
    ],
  },
  {
    slug: "emma-castro",
    name: "Emma Castro",
    initial: "E",
    age: 2,
    avatarBg: "#F4B8CC",
    avatarColor: "#C44A7A",
    birthDate: "30 ago 2023",
    room: "Soles",
    entryDate: "abr 2025",
    parents: [
      {
        name: "Andrés Castro",
        relation: "Papá",
        status: "activo",
        initial: "A",
        avatarBg: "#B9DEC4",
        avatarColor: "#fff",
      },
    ],
  },
  {
    slug: "lucas-romero",
    name: "Lucas Romero",
    initial: "L",
    age: 3,
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    birthDate: "15 nov 2022",
    room: "Soles",
    entryDate: "feb 2025",
    parents: [
      {
        name: "Carla Romero",
        relation: "Mamá",
        status: "activo",
        initial: "C",
        avatarBg: "#F4B8CC",
        avatarColor: "#fff",
      },
    ],
  },
  {
    slug: "olivia-vega",
    name: "Olivia Vega",
    initial: "O",
    age: 2,
    avatarBg: "#B9DEC4",
    avatarColor: "#3E8B62",
    birthDate: "7 oct 2023",
    room: "Soles",
    entryDate: "mar 2025",
    parents: [
      {
        name: "Gabriel Vega",
        relation: "Papá",
        status: "activo",
        initial: "G",
        avatarBg: "#C9B6E8",
        avatarColor: "#fff",
      },
    ],
  },
];
