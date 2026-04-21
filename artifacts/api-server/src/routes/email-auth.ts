import { Router, type IRouter } from "express";
import { db, playerLoginsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

const router: IRouter = Router();

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function signSession(discordId: string, username: string): Promise<string> {
  return await new SignJWT({ username, avatar: null, discriminator: "0" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(discordId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

// POST /api/auth/email/signup — { email, password, username }
router.post("/auth/email/signup", async (req, res) => {
  const { email: rawEmail, password, username: rawUsername } = req.body as {
    email?: string;
    password?: string;
    username?: string;
  };

  const email = rawEmail?.trim().toLowerCase();
  const username = rawUsername?.trim();

  if (!email || !password || !username) {
    res.status(400).json({ error: "missing_fields" });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "invalid_email" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "password_too_short" });
    return;
  }
  if (username.length < 2 || username.length > 32) {
    res.status(400).json({ error: "invalid_username" });
    return;
  }

  // Check email uniqueness
  const existingByEmail = await db
    .select({ id: playerLoginsTable.id })
    .from(playerLoginsTable)
    .where(sql`lower(${playerLoginsTable.email}) = ${email}`);
  if (existingByEmail.length > 0) {
    res.status(409).json({ error: "email_taken" });
    return;
  }

  // Check username uniqueness (case-insensitive across all accounts)
  const existingByUsername = await db
    .select({ id: playerLoginsTable.id })
    .from(playerLoginsTable)
    .where(sql`lower(${playerLoginsTable.username}) = ${username.toLowerCase()}`);
  if (existingByUsername.length > 0) {
    res.status(409).json({ error: "username_taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const discordId = `email:${randomUUID()}`;

  await db.insert(playerLoginsTable).values({
    discordId,
    username,
    discriminator: "0",
    avatar: null,
    email,
    passwordHash,
    authType: "email",
  });

  const token = await signSession(discordId, username);

  res.json({
    discordId,
    username,
    avatar: null,
    discriminator: "0",
    email,
    authType: "email",
    token,
  });
});

// POST /api/auth/email/login — { email, password }
router.post("/auth/email/login", async (req, res) => {
  const { email: rawEmail, password } = req.body as { email?: string; password?: string };

  const email = rawEmail?.trim().toLowerCase();

  if (!email || !password) {
    res.status(400).json({ error: "missing_fields" });
    return;
  }

  const rows = await db
    .select()
    .from(playerLoginsTable)
    .where(sql`lower(${playerLoginsTable.email}) = ${email}`);

  const user = rows[0];
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "invalid_credentials" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "invalid_credentials" });
    return;
  }

  await db
    .update(playerLoginsTable)
    .set({ lastLoginAt: new Date() })
    .where(eq(playerLoginsTable.discordId, user.discordId));

  const token = await signSession(user.discordId, user.username);

  res.json({
    discordId: user.discordId,
    username: user.username,
    avatar: user.avatar,
    discriminator: user.discriminator ?? "0",
    email: user.email,
    authType: "email",
    token,
  });
});

export default router;
