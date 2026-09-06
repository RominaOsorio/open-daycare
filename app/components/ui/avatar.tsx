import type { Author } from "@/app/lib/data";
import { MegaphoneIcon } from "@/app/components/icons";

type AvatarProps = {
  author: Author;
  className?: string;
  textClassName?: string;
};

export function Avatar({ author, className, textClassName }: AvatarProps) {
  return (
    <div
      className={`flex items-center justify-center flex-none rounded-full ${className ?? ""}`}
      style={{ background: author.avatarBg, color: author.avatarColor }}
    >
      {author.icon === "megaphone" ? (
        <MegaphoneIcon className="h-[55%] w-[55%]" />
      ) : (
        <span className={textClassName}>{author.initial}</span>
      )}
    </div>
  );
}
