export type PostType =
  | "logro"
  | "actividad"
  | "anuncio"
  | "comida"
  | "siesta"
  | "animo"
  | "foto";

export type PostTypeDb =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

export const POST_TYPE_TO_DB: Record<PostType, PostTypeDb> = {
  comida: "meal",
  siesta: "nap",
  actividad: "activity",
  logro: "achievement",
  animo: "mood",
  foto: "photo",
  anuncio: "announcement",
};

export const POST_TYPE_TO_UI: Record<PostTypeDb, PostType> = {
  meal: "comida",
  nap: "siesta",
  activity: "actividad",
  achievement: "logro",
  mood: "animo",
  photo: "foto",
  announcement: "anuncio",
};

export function isPostTypeDb(value: string): value is PostTypeDb {
  return value in POST_TYPE_TO_UI;
}

export interface FeedPhoto {
  path: string;
  url: string | null;
  width: number | null;
  height: number | null;
}

export interface RoomOption {
  id: string;
  name: string;
}

export interface ChildOption {
  id: string;
  name: string;
  initial: string;
  avatarBg: string;
  avatarColor: string;
  photoConsent: boolean;
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  publishedAt: string;
  type: PostType;
  audience: string;
  text: string;
  forWholeRoom: boolean;
  photos: FeedPhoto[];
  isOwn: boolean;
}

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

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function audienceLabelFromNames(
  names: string[],
  forWholeRoom: boolean,
): string {
  if (forWholeRoom) return "toda la sala";
  const firstNames = names.map(firstName);
  if (firstNames.length === 1) return `familia de ${firstNames[0]}`;
  if (firstNames.length === 2) {
    return `familia de ${firstNames[0]} y ${firstNames[1]}`;
  }
  if (firstNames.length > 2) {
    return `familia de ${firstNames.slice(0, -1).join(", ")} y ${
      firstNames[firstNames.length - 1]
    }`;
  }
  return "";
}

export function formatPostTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

export function formatTodayLabel(now = new Date()): string {
  return `${WEEKDAYS[now.getDay()]} ${now.getDate()} ${
    MONTHS_SHORT[now.getMonth()]
  }`;
}
