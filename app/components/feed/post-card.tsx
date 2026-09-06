import type { Post } from "@/app/lib/data";
import { Avatar } from "@/app/components/ui/avatar";
import { Tag } from "@/app/components/ui/tag";
import { PostActions } from "@/app/components/feed/post-actions";
import { ImageIcon } from "@/app/components/icons";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="rounded-[20px] border border-borde bg-tarjeta p-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <div className="mb-3.5 flex items-center gap-3">
        <Avatar
          author={post.author}
          className="h-11 w-11 font-display text-[17px] font-semibold"
        />
        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-tinta">
            {post.author.name}
          </div>
          <div className="text-[12.5px] text-gris">
            {post.time} · publicado por vos
          </div>
        </div>
        <Tag type={post.type} />
      </div>

      <div className="mb-2.5 text-[12.5px] text-gris">
        Para: {post.audience}
      </div>

      <p className="m-0 text-[15.5px] leading-[1.55] text-tinta-suave">
        {post.text}
      </p>

      {post.photo && (
        <a
          href="#"
          className="mt-3.5 flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-foto-borde bg-foto-fondo text-foto-texto"
        >
          <ImageIcon className="h-[30px] w-[30px]" />
          <span className="text-[13.5px]">{post.photo.label}</span>
        </a>
      )}

      <PostActions likes={post.likes} comments={post.comments} />
    </article>
  );
}
