import { useState, useEffect } from "react";

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/current-user", {
          credentials: "include", // ✅ SEND the cookie
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        setCurrentUser(data.user);
      } catch {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { currentUser, loading };
}
