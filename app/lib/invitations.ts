import type { ParentLink, Relation } from "@/app/lib/kids";

export type DbRelationship = "father" | "mother" | "guardian";

export const RELATION_TO_DB: Record<Relation, DbRelationship> = {
  "Mamá": "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
};

export const RELATION_FROM_DB: Record<DbRelationship, Relation> = {
  mother: "Mamá",
  father: "Papá",
  guardian: "Tutor/a",
};

export const PARENT_PALETTE: Array<{ bg: string; color: string }> = [
  { bg: "#C9B6E8", color: "#fff" },
  { bg: "#A9C7E8", color: "#fff" },
  { bg: "#F4B8CC", color: "#fff" },
  { bg: "#B9DEC4", color: "#fff" },
  { bg: "#F4DC8E", color: "#fff" },
  { bg: "#A9D9E8", color: "#fff" },
];

export const INVITE_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{5}$/;

export interface AcceptedParentRow {
  id: string;
  relationship: DbRelationship;
  parent: { id: string; full_name: string } | null;
}

export interface PendingParentRow {
  id: string;
  full_name: string;
  email: string;
  relationship: DbRelationship;
}

function parentAvatar(index: number) {
  return PARENT_PALETTE[index % PARENT_PALETTE.length];
}

function parentInitial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

export function mapAcceptedParent(
  row: AcceptedParentRow,
  index: number,
): ParentLink {
  const name = row.parent?.full_name ?? "";
  const avatar = parentAvatar(index);
  return {
    id: row.id,
    name,
    relation: RELATION_FROM_DB[row.relationship],
    status: "activo",
    initial: parentInitial(name),
    avatarBg: avatar.bg,
    avatarColor: avatar.color,
  };
}

export function mapPendingParent(
  row: PendingParentRow,
  index: number,
): ParentLink {
  const avatar = parentAvatar(index);
  return {
    id: row.id,
    name: row.full_name,
    relation: RELATION_FROM_DB[row.relationship],
    status: "pendiente",
    initial: parentInitial(row.full_name),
    avatarBg: avatar.bg,
    avatarColor: avatar.color,
    email: row.email,
  };
}

export function buildParentLinks(
  accepted: AcceptedParentRow[],
  pending: PendingParentRow[],
): ParentLink[] {
  return [
    ...accepted.map((row, index) => mapAcceptedParent(row, index)),
    ...pending.map((row, index) =>
      mapPendingParent(row, accepted.length + index),
    ),
  ];
}
