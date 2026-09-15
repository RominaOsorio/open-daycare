import { cookies } from "next/headers";
import { Sidebar } from "@/app/components/layout/sidebar";
import { BottomNav } from "@/app/components/layout/bottom-nav";
import { ComposerCard } from "@/app/components/feed/composer-card";
import { SectionDivider } from "@/app/components/feed/section-divider";
import { PostList } from "@/app/components/feed/post-list";
import { CreatePostProvider } from "@/app/components/feed/create-post-provider";
import { HomeGreeting } from "@/app/components/user/home-greeting";
import { AVATAR_PALETTE, sortRooms, type Room } from "@/app/lib/kids-data";
import {
  audienceLabelFromNames,
  formatTodayLabel,
  isPostTypeDb,
  POST_TYPE_TO_UI,
  type ChildOption,
  type FeedPost,
  type RoomOption,
} from "@/app/lib/posts";
import { createClient } from "@/utils/supabase/server";

interface ProfileRow {
  id: string;
  full_name: string;
  role: string;
  daycare_id: string | null;
  daycares: { name: string } | { name: string }[] | null;
}

interface ChildRow {
  id: string;
  full_name: string;
  room_id: string;
  photo_consent: boolean;
}

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

export default async function Home() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = user
    ? await supabase
        .from("users")
        .select("id, full_name, role, daycare_id, daycares(name)")
        .eq("id", user.id)
        .single()
    : { data: null };
  const profile = profileData as ProfileRow | null;
  const isStaff = profile?.role === "staff" && profile?.daycare_id != null;

  let rooms: RoomOption[] = [];
  const childrenByRoom: Record<string, ChildOption[]> = {};
  let childrenCount = 0;

  if (isStaff) {
    const [roomsRes, childrenRes] = await Promise.all([
      supabase.from("rooms").select("id, name"),
      supabase
        .from("children")
        .select("id, full_name, room_id, photo_consent")
        .eq("status", "active")
        .order("full_name"),
    ]);

    rooms = sortRooms((roomsRes.data ?? []) as Room[]).map((room) => ({
      id: room.id,
      name: room.name,
    }));

    const children = (childrenRes.data ?? []) as ChildRow[];
    childrenCount = children.length;
    children.forEach((child, index) => {
      const palette = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
      const bucket = childrenByRoom[child.room_id] ?? [];
      bucket.push({
        id: child.id,
        name: child.full_name,
        initial: child.full_name.trim().charAt(0).toUpperCase(),
        avatarBg: palette.bg,
        avatarColor: palette.color,
        photoConsent: child.photo_consent,
      });
      childrenByRoom[child.room_id] = bucket;
    });
  }

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

  const daycare = profile ? embeddedOne(profile.daycares) : null;
  const headerLabel =
    isStaff && daycare ? daycare.name.toUpperCase() : "GUARDERÍA";
  const dateLabel = formatTodayLabel();

  return (
    <CreatePostProvider
      rooms={rooms}
      childrenByRoom={childrenByRoom}
      canPost={isStaff}
    >
      <div className="flex min-h-screen bg-crema">
        <Sidebar />
        <BottomNav />
        <main className="min-w-0 flex-1 overflow-y-auto">
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
        </main>
      </div>
    </CreatePostProvider>
  );
}
