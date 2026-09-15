"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CreatePostModal } from "@/app/components/feed/create-post-modal";
import type { ChildOption, RoomOption } from "@/app/lib/posts";

interface CreatePostContextValue {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const noop = () => {};

const defaultContext: CreatePostContextValue = {
  open: false,
  openModal: noop,
  closeModal: noop,
};

const CreatePostContext =
  createContext<CreatePostContextValue>(defaultContext);

export function CreatePostProvider({
  children,
  rooms,
  childrenByRoom,
  canPost,
}: {
  children: ReactNode;
  rooms: RoomOption[];
  childrenByRoom: Record<string, ChildOption[]>;
  canPost: boolean;
}) {
  const [open, setOpen] = useState(false);

  const openModal = useCallback(() => {
    if (canPost) setOpen(true);
  }, [canPost]);
  const closeModal = useCallback(() => setOpen(false), []);

  return (
    <CreatePostContext.Provider value={{ open, openModal, closeModal }}>
      {children}
      {canPost && open && (
        <CreatePostModal
          onClose={closeModal}
          rooms={rooms}
          childrenByRoom={childrenByRoom}
        />
      )}
    </CreatePostContext.Provider>
  );
}

export function useCreatePost(): CreatePostContextValue {
  return useContext(CreatePostContext);
}
