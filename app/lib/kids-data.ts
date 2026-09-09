export interface Room {
  id: string;
  name: string;
}

export interface Kid {
  id: string;
  name: string;
  initial: string;
  age: number;
  avatarBg: string;
  avatarColor: string;
  allergy?: string;
  allergyTags: string[];
  roomId: string;
  roomName: string;
  birthDate: string;
  entryDate: string;
  notes?: string;
}

export interface NewKidInput {
  name: string;
  birthDate: string;
  roomId: string;
  allergyTags: string[];
  notes: string;
}

export interface ChildRow {
  id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string | null;
  allergy_tags: string[];
  status: string;
  room_id: string;
}

export const AVATAR_PALETTE: Array<{ bg: string; color: string }> = [
  { bg: "#A9D9E8", color: "#1F7A93" },
  { bg: "#F4B8CC", color: "#C44A7A" },
  { bg: "#B9DEC4", color: "#3E8B62" },
  { bg: "#F4DC8E", color: "#9A7B1E" },
  { bg: "#C9B6E8", color: "#7B5FC0" },
];

const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const ALLERGY_TO_TAG: Record<string, string> = {
  mani: "peanut",
  "maní": "peanut",
  peanut: "peanut",
  lactosa: "lactose",
  lactose: "lactose",
  gluten: "gluten",
  huevo: "egg",
  egg: "egg",
  soja: "soy",
  soya: "soy",
  soy: "soy",
  nueces: "nuts",
  "frutos secos": "nuts",
  nuts: "nuts",
};

const TAG_TO_LABEL: Record<string, string> = {
  peanut: "MANÍ",
  lactose: "LACTOSA",
  gluten: "GLUTEN",
  egg: "HUEVO",
  soy: "SOJA",
  nuts: "FRUTOS SECOS",
};

export function sortRooms(rooms: Room[]): Room[] {
  return [...rooms].sort((a, b) => {
    if (a.name === "Soles") return -1;
    if (b.name === "Soles") return 1;
    return a.name.localeCompare(b.name);
  });
}

export function ageFromBirthDate(
  birthDate: string,
  today = new Date(),
): number {
  const parts = birthDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return 0;
  const [year, month, day] = parts;
  let age = today.getFullYear() - year;
  const beforeBirthday =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

export function formatBirthDate(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return "";
  const [year, month, day] = parts;
  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}

export function formatEntryDate(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return "";
  const [year, month] = parts;
  return `${MONTHS_SHORT[month - 1]} ${year}`;
}

export function parseAllergies(text: string): {
  tags: string[];
  extra: string[];
} {
  const tags: string[] = [];
  const extra: string[] = [];
  text
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((token) => {
      const normalized = token.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const tag = ALLERGY_TO_TAG[normalized];
      if (tag && !tags.includes(tag)) tags.push(tag);
      else extra.push(token);
    });
  return { tags, extra };
}

export function allergyLabel(tags: string[]): string | undefined {
  const labels = tags
    .map((tag) => TAG_TO_LABEL[tag] ?? tag.toUpperCase())
    .filter(Boolean);
  return labels.length > 0 ? labels.join(", ") : undefined;
}

export function mapChildRow(row: ChildRow, roomName: string, index: number): Kid {
  const palette = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
  return {
    id: row.id,
    name: row.full_name,
    initial: row.full_name.trim().charAt(0).toUpperCase(),
    age: ageFromBirthDate(row.birth_date),
    avatarBg: palette.bg,
    avatarColor: palette.color,
    allergy: allergyLabel(row.allergy_tags),
    allergyTags: row.allergy_tags,
    roomId: row.room_id,
    roomName,
    birthDate: formatBirthDate(row.birth_date),
    entryDate: formatEntryDate(row.enrolled_at),
    notes: row.medical_notes ?? undefined,
  };
}

export function toIsoDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }
  return `${year}-${month}-${day}`;
}

export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
