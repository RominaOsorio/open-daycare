"use server";

import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { INVITE_CODE_PATTERN, RELATION_TO_DB } from "@/app/lib/invitations";
import { isValidEmail, type Relation } from "@/app/lib/kids";
import { sendInvitationEmail } from "@/app/lib/resend";
import { createClient } from "@/utils/supabase/server";

export interface CreateInvitationInput {
  childId: string;
  name: string;
  email: string;
  relation: Relation;
  code: string;
}

export type CreateInvitationResult =
  | { ok: true; resent: boolean }
  | { ok: false; error: string; regenerateCode?: boolean };

const GENERIC_ERROR = "No pudimos guardar la invitación. Intentá de nuevo.";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface InvitationRow {
  id: string;
  email: string;
  status: string;
}

function mapDbError(error: { code?: string }): CreateInvitationResult {
  if (error.code === "23505") {
    return {
      ok: false,
      error: "El código se repitió. Generá uno nuevo.",
      regenerateCode: true,
    };
  }
  if (error.code === "42501") {
    return { ok: false, error: "No tenés permiso para invitar en este niño." };
  }
  return { ok: false, error: GENERIC_ERROR };
}

export async function createInvitation(
  input: CreateInvitationInput,
): Promise<CreateInvitationResult> {
  const name = input.name.trim();
  const email = input.email.trim();
  const code = input.code.trim().toUpperCase();

  if (
    !UUID_PATTERN.test(input.childId) ||
    !name ||
    !isValidEmail(email) ||
    !INVITE_CODE_PATTERN.test(code) ||
    !(input.relation in RELATION_TO_DB)
  ) {
    return { ok: false, error: "Datos inválidos." };
  }

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autorizado." };

  const { data: child, error: childError } = await supabase
    .from("children")
    .select("full_name")
    .eq("id", input.childId)
    .eq("status", "active")
    .maybeSingle();
  if (childError) return mapDbError(childError);
  if (!child) {
    return { ok: false, error: "No tenés permiso para invitar en este niño." };
  }

  const { data, error: selectError } = await supabase
    .from("invitations")
    .select("id, email, status")
    .eq("child_id", input.childId);
  if (selectError) return mapDbError(selectError);

  const invitations = (data ?? []) as InvitationRow[];
  const normalized = email.toLowerCase();
  const accepted = invitations.find(
    (row) => row.status === "accepted" && row.email.toLowerCase() === normalized,
  );
  if (accepted) {
    return { ok: false, error: "Este email ya está vinculado a este niño." };
  }

  const pending = invitations.find(
    (row) => row.status === "pending" && row.email.toLowerCase() === normalized,
  );
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const relationship = RELATION_TO_DB[input.relation];

  let resent = false;
  if (pending) {
    const { data: updated, error } = await supabase
      .from("invitations")
      .update({
        full_name: name,
        relationship,
        code,
        expires_at: expiresAt,
      })
      .eq("id", pending.id)
      .select("id");
    if (error) return mapDbError(error);
    if (!updated || updated.length === 0) {
      return {
        ok: false,
        error: "No tenés permiso para invitar en este niño.",
      };
    }
    resent = true;
  } else {
    const { error } = await supabase.from("invitations").insert({
      child_id: input.childId,
      invited_by: user.id,
      full_name: name,
      email,
      relationship,
      code,
      expires_at: expiresAt,
    });
    if (error) return mapDbError(error);
  }

  refresh();

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const link = `${origin}/activar-cuenta?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`;
  const sent = await sendInvitationEmail({
    to: email,
    parentName: name,
    childName: child.full_name,
    code,
    link,
  });
  if (!sent.ok) {
    return {
      ok: false,
      error: `La invitación quedó guardada, pero no pudimos enviar el correo (${sent.error}). Podés reintentar.`,
    };
  }

  return { ok: true, resent };
}
