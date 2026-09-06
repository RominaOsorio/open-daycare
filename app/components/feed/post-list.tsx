"use client";

import { PostCard } from "@/app/components/feed/post-card";
import { useCreatePost } from "@/app/components/feed/create-post-provider";

export function PostList() {
  const { posts } = useCreatePost();
  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
