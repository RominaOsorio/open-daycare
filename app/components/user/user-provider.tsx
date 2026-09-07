"use client";

import { createClient } from "@/utils/supabase/client";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface Profile {
  id: string;
  full_name: string;
  role: "staff" | "parent" | "admin";
  avatar_url: string | null;
  daycare_id: string | null;
}

interface UserContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  profile: null,
  loading: true,
});

async function fetchProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<Profile | null> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  return (data as Profile) ?? null;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserContextValue>({
    user: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      const profile = user ? await fetchProfile(supabase, user) : null;
      if (!cancelled) setState({ user, profile, loading: false });
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" && session?.user) {
        setState({ user: session.user, profile: null, loading: true });
        fetchProfile(supabase, session.user).then((profile) => {
          if (!cancelled) {
            setState({ user: session.user, profile, loading: false });
          }
        });
      } else if (event === "SIGNED_OUT") {
        setState({ user: null, profile: null, loading: false });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return <UserContext.Provider value={state}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
