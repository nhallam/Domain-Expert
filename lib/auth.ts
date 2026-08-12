import "server-only";
import { cookies } from "next/headers";
import { getDb, getUserById, newId } from "./db";
import type { User } from "./types";

// Auth is intentionally a thin, swappable layer. Today there is one provider
// ('mock'); v2 replaces the provider internals with LinkedIn OIDC while
// getSession()/createSession()/destroySession() and the User model stay put.

const SESSION_COOKIE = "dx_session";

export async function getSession(): Promise<User | null> {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  return getUserById(userId);
}

export async function createSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export type MockProfile = {
  name: string;
  email?: string;
  avatarUrl: string;
  headline: string;
  industry: string;
};

// Mock equivalent of "the identity the provider returned, plus the in-app
// profile fields". LinkedIn OIDC won't give us headline/industry either, so
// those stay user-entered in every provider.
export function upsertMockUser(profile: MockProfile, providerId?: string): User {
  const db = getDb();
  if (providerId) {
    const existing = db
      .prepare("SELECT * FROM users WHERE authProvider = 'mock' AND providerId = ?")
      .get(providerId) as User | undefined;
    if (existing) return existing;
  }
  const user: User = {
    id: newId(),
    name: profile.name.trim().slice(0, 80),
    email: profile.email?.trim() || `${profile.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".")}@demo.example.com`,
    avatarUrl: profile.avatarUrl || null,
    headline: profile.headline.trim().slice(0, 120),
    industry: profile.industry,
    authProvider: "mock",
    providerId: providerId ?? `mock-${newId()}`,
    createdAt: Date.now(),
  };
  db.prepare(
    `INSERT INTO users (id, name, email, avatarUrl, headline, industry, authProvider, providerId, createdAt)
     VALUES (@id, @name, @email, @avatarUrl, @headline, @industry, @authProvider, @providerId, @createdAt)`
  ).run(user);
  return user;
}

export function getPersonaUsers(): User[] {
  return getDb()
    .prepare("SELECT * FROM users WHERE providerId LIKE 'mock-persona-%' ORDER BY providerId")
    .all() as User[];
}
