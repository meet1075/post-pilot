/**
 * PostPilot — Better Auth React Client
 *
 * Provides:
 * - signIn.social({ provider: 'google', callbackURL: '/' })
 * - signOut()
 * - useSession() hook
 * - getSession()
 */

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:8080",
});

export const { signIn, signOut, useSession, getSession } = authClient;
