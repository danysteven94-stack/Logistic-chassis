"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppUser } from "@/lib/types";

export function useCurrentUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { setLoading(false); return; }
      const { data } = await supabase.from("users").select("*").eq("id", auth.user.id).single();
      setUser(data as AppUser);
      setLoading(false);
    })();
  }, []);

  return { user, loading };
}
