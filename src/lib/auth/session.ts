import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { currentUser, mockCredentials } from "@lib/mock-data";

const SESSION_COOKIE_NAME = "ticktock_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET ?? "tentwenty-assessment-secret";

if (process.env.NODE_ENV === "production" && !process.env.AUTH_SESSION_SECRET) {
  throw new Error("AUTH_SESSION_SECRET must be set in production.");
}

interface SessionPayload {
  userId: string;
  email: string;
  exp: number;
}

function sign(value: string) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  const expected = sign(body);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;

    if (parsed.exp * 1000 <= Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function isValidDemoCredential(email: string, password: string) {
  return email === mockCredentials.email && password === mockCredentials.password;
}

export async function createSession(remember: boolean) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const payload: SessionPayload = {
    userId: currentUser.id,
    email: currentUser.email,
    exp: Math.floor(expiresAt.getTime() / 1000),
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, encode(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { expires: expiresAt } : {}),
  });

  return currentUser;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = decode(token);

  if (!payload || payload.userId !== currentUser.id || payload.email !== currentUser.email) {
    return null;
  }

  return currentUser;
}

export const sessionCookieName = SESSION_COOKIE_NAME;
