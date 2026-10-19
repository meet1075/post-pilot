import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { auth, getAuth, getActivePool } from "./lib/auth-server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Resolve Cloudflare Worker env from either argument, request context, or globalThis.__env__
      const cfEnv =
        (env && typeof env === "object")
          ? env
          : (request as any)?.runtime?.cloudflare?.env ?? (globalThis as any).__env__;

      if (cfEnv && typeof cfEnv === "object") {
        (globalThis as any).__env__ = cfEnv;
        for (const [key, value] of Object.entries(cfEnv as Record<string, unknown>)) {
          if (typeof value === "string") {
            process.env[key] = value;
          }
        }
      }

      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/auth")) {
        try {
          const authInstance = getAuth(cfEnv, request);
          const response = await authInstance.handler(request);
          const currentPool = getActivePool();
          if (currentPool) {
            const waitUntil = (ctx as any)?.waitUntil ?? (request as any)?.waitUntil;
            if (typeof waitUntil === "function") {
              waitUntil(currentPool.end().catch(() => {}));
            }
          }
          return response;
        } catch (authError) {
          console.error("[Better-Auth Handler Exception]", authError);
          const currentPool = getActivePool();
          if (currentPool) {
            const waitUntil = (ctx as any)?.waitUntil ?? (request as any)?.waitUntil;
            if (typeof waitUntil === "function") {
              waitUntil(currentPool.end().catch(() => {}));
            }
          }
          if (authError && typeof authError === "object" && "status" in authError && typeof (authError as any).status === "number") {
            const status = (authError as any).status;
            const headers = (authError as any).headers || {};
            return new Response((authError as any).body || null, { status, headers });
          }
          return new Response(JSON.stringify({ error: authError instanceof Error ? authError.message : "Authentication error" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const currentPool = getActivePool();
      if (currentPool) {
        const waitUntil = (ctx as any)?.waitUntil ?? (request as any)?.waitUntil;
        if (typeof waitUntil === "function") {
          waitUntil(currentPool.end().catch(() => {}));
        }
      }
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
