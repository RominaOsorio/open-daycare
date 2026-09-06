"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { Post } from "@/app/lib/data";
import { POSTS } from "@/app/lib/data";
import { CreatePostModal } from "@/app/components/feed/create-post-modal";

interface CreatePostContextValue {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
  posts: Post[];
  addPost: (post: Post) => void;
}

const noop = () => {};

const defaultContext: CreatePostContextValue = {
  open: false,
  openModal: noop,
  closeModal: noop,
  posts: [],
  addPost: noop,
};

const CreatePostContext =
  createContext<CreatePostContextValue>(defaultContext);

export function CreatePostProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>(POSTS);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  const addPost = useCallback((post: Post) => {
    setPosts((current) => [post, ...current]);
    setOpen(false);
  }, []);

  return (
    <CreatePostContext.Provider
      value={{ open, openModal, closeModal, posts, addPost }}
    >
      {children}
      <CreatePostModal
        open={open}
        onClose={closeModal}
        onPublish={addPost}
      />
    </CreatePostContext.Provider>
  );
}

export function useCreatePost(): CreatePostContextValue {
  return useContext(CreatePostContext);
}
