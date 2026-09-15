import { cookies } from "next/headers";
import { ComposerCard } from "@/app/components/feed/composer-card";
import { SectionDivider } from "@/app/components/feed/section-divider";
import { PostList } from "@/app/components/feed/post-list";
import { HomeGreeting } from "@/app/components/user/home-greeting";
import { getComposerData } from "@/app/lib/composer-data";
import { getProfile } from "@/app/lib/dal";
import {
  audienceLabelFromNames,
  formatTodayLabel,
  isPostTypeDb,
  POST_TYPE_TO_UI,
  type FeedPost,
} from "@/app/lib/posts";
import { createClient } from "@/utils/supabase/server";

interface PostRow {
  id: string;
  author_id: string;
  type: string;
  body: string;
  published_at: string;
  for_whole_room: boolean;
  author: { full_name: string } | { full_name: string }[] | null;
  post_children: Array<{
    child: { full_name: string } | { full_name: string }[] | null;
  }> | null;
  post_photos: Array<{
    url: string;
    width: number | null;
    height: number | null;
    position: number;
  }> | null;
}

function embeddedOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function FeedScreen() {
  const supabase = createClient(await cookies());
  const profile = await getProfile();
  const isStaff = profile?.role === "staff" && profile?.daycare_id != null;

  const childrenCount = isStaff ? (await getComposerData()).childrenCount : 0;

  const { data: postsData } = await supabase
    .from("posts")
    .select(
      "id, author_id, type, body, published_at, for_whole_room, author:users!posts_author_id_fkey(full_name), post_children(child:children!post_children_child_id_fkey(full_name)), post_photos(url, width, height, position)",
    )
    .order("published_at", { ascending: false })
    .limit(50);

  const rows = (postsData ?? []) as unknown as PostRow[];

  const photoPaths = rows.flatMap((row) =>
    (row.post_photos ?? []).map((photo) => photo.url),
  );
  const signedByPath = new Map<string, string>();
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("post-photos")
      .createSignedUrls(photoPaths, 3600);
    (signed ?? []).forEach((item) => {
      if (item.path && item.signedUrl) {
        signedByPath.set(item.path, item.signedUrl);
      }
    });
  }

  const posts: FeedPost[] = rows.map((row) => {
    const type = isPostTypeDb(row.type)
      ? POST_TYPE_TO_UI[row.type]
      : "actividad";
    const childNames = (row.post_children ?? [])
      .map((tag) => embeddedOne(tag.child)?.full_name)
      .filter((name): name is string => Boolean(name));
    const audience = isStaff
      ? audienceLabelFromNames(childNames, row.for_whole_room)
      : "";
    const authorName = embeddedOne(row.author)?.full_name ?? "Guardería";

    return {
      id: row.id,
      authorId: row.author_id,
      authorName,
      publishedAt: row.published_at,
      type,
      audience,
      text: row.body,
      forWholeRoom: row.for_whole_room,
      isOwn: profile?.id === row.author_id,
      photos: (row.post_photos ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((photo) => ({
          path: photo.url,
          url: signedByPath.get(photo.url) ?? null,
          width: photo.width,
          height: photo.height,
        })),
    };
  });

  const headerLabel =
    isStaff && profile?.daycare_name
      ? profile.daycare_name.toUpperCase()
      : "GUARDERÍA";
  const dateLabel = formatTodayLabel();

  return (
    <div className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-[34px] sm:px-10 lg:pb-20">
      <div className="mb-6">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-rojo">
          {headerLabel}
        </div>
        <HomeGreeting />
        <p className="m-0 mt-[5px] text-[14.5px] text-gris-oscuro">
          {isStaff ? `${childrenCount} niños · ${dateLabel}` : dateLabel}
        </p>
      </div>

      {isStaff && <ComposerCard />}
      <SectionDivider />

      <PostList posts={posts} />
    </div>
  );
}
