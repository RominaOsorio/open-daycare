import { PostCard } from "@/app/components/feed/post-card";
import type { FeedPost } from "@/app/lib/posts";

export function PostList({ posts }: { posts: FeedPost[] }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-[20px] border border-borde bg-tarjeta px-6 py-10 text-center">
        <p className="m-0 font-display text-[17px] font-semibold text-tinta">
          Todavía no hay publicaciones
        </p>
        <p className="m-0 mt-1.5 text-[14px] text-gris">
          Cuando el staff comparta un momento, lo vas a ver acá.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
