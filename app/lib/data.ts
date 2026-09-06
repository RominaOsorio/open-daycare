export type PostType = "logro" | "actividad" | "anuncio";

export interface Author {
  name: string;
  initial: string;
  avatarBg: string;
  avatarColor: string;
  icon?: "megaphone";
}

export interface Post {
  id: string;
  author: Author;
  time: string;
  type: PostType;
  audience: string;
  text: string;
  photo?: { label: string };
  likes: number;
  comments: number;
}

export const ROOM = {
  name: "Sala Soles",
  label: "GUARDERÍA · SALA SOLES",
  childrenCount: 12,
  date: "martes 17 jun",
};

export const USER = {
  name: "Caro Giménez",
  role: "Maestra · Soles",
  initial: "C",
  avatarBg: "#F2937A",
  avatarColor: "#fff",
};

export const POSTS: Post[] = [
  {
    id: "1",
    author: {
      name: "Mateo",
      initial: "M",
      avatarBg: "#A9D9E8",
      avatarColor: "#1F7A93",
    },
    time: "14:20",
    type: "logro",
    audience: "familia de Mateo",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "2",
    author: {
      name: "Mateo",
      initial: "M",
      avatarBg: "#A9D9E8",
      avatarColor: "#1F7A93",
    },
    time: "09:40",
    type: "actividad",
    audience: "familia de Mateo",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photo: { label: "Foto · pintando con témperas" },
    likes: 5,
    comments: 2,
  },
  {
    id: "3",
    author: {
      name: "Anuncio general",
      initial: "",
      avatarBg: "#CCD8F4",
      avatarColor: "#4E72C8",
      icon: "megaphone",
    },
    time: "07:50",
    type: "anuncio",
    audience: "toda la sala",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];
