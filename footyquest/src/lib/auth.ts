import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "footyquest-dev-secret-change-in-production"
);

export type SessionPayload =
  | { kind: "user"; id: string; role: "PARENT" | "COACH" }
  | { kind: "child"; id: string };

const COOKIE = "fq_session";

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function requireChild() {
  const session = await getSession();
  if (!session || session.kind !== "child") return null;
  return prisma.childProfile.findUnique({ where: { id: session.id } });
}

export async function requireUser(role?: "PARENT" | "COACH") {
  const session = await getSession();
  if (!session || session.kind !== "user") return null;
  if (role && session.role !== role) return null;
  return prisma.user.findUnique({ where: { id: session.id } });
}

export function hashSecret(value: string) {
  return bcrypt.hash(value, 10);
}

export function verifySecret(value: string, hash: string) {
  return bcrypt.compare(value, hash);
}
