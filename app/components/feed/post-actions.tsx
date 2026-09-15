import { CommentIcon, HeartIcon } from "@/app/components/icons";

export function PostActions({
  likes,
  comments,
  showEdit = false,
}: {
  likes: number;
  comments: number;
  showEdit?: boolean;
}) {
  return (
    <div className="mt-4 flex items-center gap-4.5 border-t border-borde-claro pt-3.5">
      <span className="flex items-center gap-1.5 text-sm font-bold text-naranja">
        <HeartIcon className="h-[19px] w-[19px]" />
        {likes}
      </span>
      <a
        href="#"
        className="flex items-center gap-1.5 text-sm font-bold text-gris-oscuro"
      >
        <CommentIcon className="h-[18px] w-[18px]" />
        {comments}
      </a>
      <span className="flex-1" />
      {showEdit && (
        <a href="#" className="text-sm font-extrabold text-rojo-oscuro">
          Editar
        </a>
      )}
    </div>
  );
}
