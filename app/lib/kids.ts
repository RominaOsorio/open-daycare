export type ParentStatus = "activo" | "pendiente";

export interface ParentLink {
  name: string;
  relation: string;
  status: ParentStatus;
  initial: string;
  avatarBg: string;
  avatarColor: string;
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
