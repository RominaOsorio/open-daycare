"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { isPostTypeDb, type PostTypeDb } from "@/app/lib/posts";
import { createClient } from "@/utils/supabase/server";

export interface CreatePostResult {
  ok: boolean;
  error?: string;
}

interface ChildRow {
  id: string;
  full_name: string;
  photo_consent: boolean;
}

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_BODY_LENGTH = 2000;
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GENERIC_ERROR = "No pudimos publicar. Intentá de nuevo.";

function parseDims(
  raw: string,
): Array<{ width: number | null; height: number | null }> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => {
      const record = item as { width?: unknown; height?: unknown };
      const width =
        typeof record.width === "number" && Number.isFinite(record.width)
          ? Math.round(record.width)
          : null;
      const height =
        typeof record.height === "number" && Number.isFinite(record.height)
          ? Math.round(record.height)
          : null;
      return { width, height };
    });
  } catch {
    return [];
  }
}

export async function createPost(
  formData: FormData,
): Promise<CreatePostResult> {
  const typeRaw = String(formData.get("type") ?? "");
  const roomId = String(formData.get("roomId") ?? "");
  const wholeRoom = formData.get("wholeRoom") === "1";
  const body = String(formData.get("body") ?? "").trim();
  const childIds = formData
    .getAll("childIds")
    .map((value) => String(value))
    .filter(Boolean);
  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const dims = parseDims(String(formData.get("photoDims") ?? "[]"));

  if (!isPostTypeDb(typeRaw)) {
    return { ok: false, error: "Elegí un tipo de publicación." };
  }
  const type: PostTypeDb = typeRaw;
  if (!UUID_PATTERN.test(roomId)) {
    return { ok: false, error: "Elegí una sala." };
  }
  if (body.length === 0) {
    return { ok: false, error: "Escribí una descripción." };
  }
  if (body.length > MAX_BODY_LENGTH) {
    return {
      ok: false,
      error: `La descripción no puede superar los ${MAX_BODY_LENGTH} caracteres.`,
    };
  }
  if (files.length > MAX_PHOTOS) {
    return { ok: false, error: `Podés adjuntar hasta ${MAX_PHOTOS} fotos.` };
  }
  for (const file of files) {
    if (!ALLOWED_MIME[file.type]) {
      return { ok: false, error: "Solo se permiten imágenes JPG, PNG o WEBP." };
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return { ok: false, error: "Cada foto puede pesar hasta 5 MB." };
    }
  }
  if (type === "photo" && files.length === 0) {
    return { ok: false, error: "El tipo Foto necesita al menos una imagen." };
  }
  if (!wholeRoom && childIds.length === 0) {
    return { ok: false, error: "Elegí a quién va dirigida la publicación." };
  }

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autorizado." };

  const { data: profile } = await supabase
    .from("users")
    .select("id, role, daycare_id")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "staff" || !profile.daycare_id) {
    return { ok: false, error: "No tenés permiso para publicar." };
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", roomId)
    .eq("daycare_id", profile.daycare_id)
    .maybeSingle();
  if (!room) {
    return { ok: false, error: "La sala no pertenece a tu guardería." };
  }

  const { data: childrenData } = await supabase
    .from("children")
    .select("id, full_name, photo_consent")
    .eq("room_id", roomId)
    .eq("status", "active");
  const roomChildren = (childrenData ?? []) as ChildRow[];
  const roomChildIds = new Set(roomChildren.map((child) => child.id));

  let taggedChildIds: string[] = [];
  if (wholeRoom) {
    if (type === "announcement") {
      taggedChildIds = [];
    } else if (files.length > 0) {
      taggedChildIds = roomChildren
        .filter((child) => child.photo_consent)
        .map((child) => child.id);
    } else {
      taggedChildIds = roomChildren.map((child) => child.id);
    }
    if (type !== "announcement" && taggedChildIds.length === 0) {
      return {
        ok: false,
        error: "No hay niños activos en la sala para etiquetar.",
      };
    }
  } else {
    const invalid = childIds.filter((id) => !roomChildIds.has(id));
    if (invalid.length > 0) {
      return { ok: false, error: "Algún niño no pertenece a la sala elegida." };
    }
    if (files.length > 0) {
      const withoutConsent = roomChildren.filter(
        (child) => childIds.includes(child.id) && !child.photo_consent,
      );
      if (withoutConsent.length > 0) {
        const names = withoutConsent
          .map((child) => child.full_name)
          .join(", ");
        return {
          ok: false,
          error: `${names} no autorizaron imágenes: no podés etiquetarlos en una publicación con fotos.`,
        };
      }
    }
    taggedChildIds = childIds;
  }

  const insertRoomId = type === "announcement" && !wholeRoom ? null : roomId;

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      room_id: insertRoomId,
      type,
      body,
      for_whole_room: wholeRoom,
    })
    .select("id")
    .single();
  if (postError || !post) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const cleanup = async (paths: string[]) => {
    if (paths.length > 0) {
      await supabase.storage.from("post-photos").remove(paths);
    }
    await supabase.from("posts").delete().eq("id", post.id);
  };

  if (taggedChildIds.length > 0) {
    const { error: tagsError } = await supabase
      .from("post_children")
      .insert(
        taggedChildIds.map((childId) => ({
          post_id: post.id,
          child_id: childId,
        })),
      );
    if (tagsError) {
      await cleanup([]);
      return { ok: false, error: GENERIC_ERROR };
    }
  }

  const uploadedPaths: string[] = [];
  const photoRows: Array<{
    post_id: string;
    url: string;
    width: number | null;
    height: number | null;
    position: number;
  }> = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const extension = ALLOWED_MIME[file.type];
    const path = `${profile.daycare_id}/${post.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("post-photos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      await cleanup(uploadedPaths);
      return {
        ok: false,
        error: "No pudimos subir las fotos. Intentá de nuevo.",
      };
    }
    uploadedPaths.push(path);
    const dim = dims[index] ?? { width: null, height: null };
    photoRows.push({
      post_id: post.id,
      url: path,
      width: dim.width,
      height: dim.height,
      position: index,
    });
  }

  if (photoRows.length > 0) {
    const { error: photosError } = await supabase
      .from("post_photos")
      .insert(photoRows);
    if (photosError) {
      await cleanup(uploadedPaths);
      return { ok: false, error: GENERIC_ERROR };
    }
  }

  refresh();
  return { ok: true };
}
