import { Avatar } from "@/app/components/ui/avatar";
import { Tag } from "@/app/components/ui/tag";
import { PostActions } from "@/app/components/feed/post-actions";
import { USER } from "@/app/lib/data";
import { formatPostTime, type FeedPhoto, type FeedPost } from "@/app/lib/posts";

function PhotoGrid({ photos }: { photos: FeedPhoto[] }) {
  const visible = photos.filter(
    (photo): photo is FeedPhoto & { url: string } => photo.url !== null,
  );
  if (visible.length === 0) return null;

  if (visible.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={visible[0].url}
        alt="Foto de la publicación"
        loading="lazy"
        className="mt-3.5 h-[240px] w-full rounded-2xl border border-borde object-cover"
      />
    );
  }

  return (
    <div className="mt-3.5 grid grid-cols-2 gap-2">
      {visible.map((photo) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={photo.path}
          src={photo.url}
          alt="Foto de la publicación"
          loading="lazy"
          className="h-[150px] w-full rounded-xl border border-borde object-cover"
        />
      ))}
    </div>
  );
}

export function PostCard({ post }: { post: FeedPost }) {
  const initial = post.authorName.trim().charAt(0).toUpperCase() || "G";

  return (
    <article className="rounded-[20px] border border-borde bg-tarjeta p-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <div className="mb-3.5 flex items-center gap-3">
        <Avatar
          author={{
            name: post.authorName,
            initial,
            avatarBg: USER.avatarBg,
            avatarColor: USER.avatarColor,
          }}
          className="h-11 w-11 font-display text-[17px] font-semibold"
        />
        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-tinta">
            {post.authorName}
          </div>
          <div className="text-[12.5px] text-gris">
            {formatPostTime(post.publishedAt)}
            {post.isOwn ? " · publicado por vos" : ""}
          </div>
        </div>
        <Tag type={post.type} />
      </div>

      {post.audience && (
        <div className="mb-2.5 text-[12.5px] text-gris">
          Para: {post.audience}
        </div>
      )}

      <p className="m-0 whitespace-pre-wrap text-[15.5px] leading-[1.55] text-tinta-suave">
        {post.text}
      </p>

      <PhotoGrid photos={post.photos} />

      <PostActions likes={0} comments={0} showEdit={post.isOwn} />
    </article>
  );
}
