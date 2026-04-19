import { useState, useEffect } from "react";

const STORAGE_KEY = "void_player_session";

interface Session {
  discordId: string;
  username: string;
  avatar: string | null;
  token: string;
}

interface SessionWithRoles extends Session {
  roles: string[];
}

function getStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function useSession() {
  const [session, setSession] = useState<SessionWithRoles | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      setLoading(false);
      return;
    }

    fetch("/api/auth/verify", {
      headers: { Authorization: `Bearer ${stored.token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("invalid");
        return res.json() as Promise<{ discordId: string; username: string; avatar: string | null; roles: string[] }>;
      })
      .then((data) => {
        setSession({ ...stored, roles: data.roles });
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { session, loading };
}
