import { type Request, type Response, type NextFunction } from "express";
import { jwtVerify } from "jose";

export const MEONIX_ID = "1243206708604702791";

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface AuthUser {
  discordId: string;
  username: string;
  avatar: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "no_token" });
    return;
  }
  try {
    const token = authHeader.slice(7);
    const { payload } = await jwtVerify(token, getJwtSecret());
    req.user = {
      discordId: payload.sub as string,
      username: payload["username"] as string,
      avatar: (payload["avatar"] as string | null) ?? null,
    };
    next();
  } catch {
    res.status(401).json({ error: "invalid_token" });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    if (req.user?.discordId !== MEONIX_ID) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    next();
  });
}
