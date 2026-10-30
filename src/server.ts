import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { auth, getAuth } from "./lib/auth-server";

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

function isClientAbort(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof Error) {
    if (err.name === "AbortError" || err.message.includes("aborted") || (err as any).code === "ECONNRESET") {
      return true;
    }
    if (err.cause && isClientAbort(err.cause)) return true;
  }
  const str = String(err);
  return str.includes("aborted") || str.includes("ECONNRESET");
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  const capturedErr = consumeLastCapturedError();
  if (isClientAbort(capturedErr)) {
    return new Response(null, { status: 499, statusText: "Client Closed Request" });
  }

  console.error(capturedErr ?? new Error(`h3 swallowed SSR error: ${body}`));
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

      // Compute CORS headers for the request origin so responses are visible in browser DevTools
      const reqOrigin = request.headers.get("origin") || "";
      const isAllowedOrigin =
        !reqOrigin ||
        reqOrigin.includes("workers.dev") ||
        reqOrigin.includes("localhost") ||
        reqOrigin.includes("127.0.0.1") ||
        reqOrigin.startsWith("http");

      const effectiveOrigin = isAllowedOrigin ? (reqOrigin || "*") : "*";
      const corsHeaders: Record<string, string> = {
        "Access-Control-Allow-Origin": effectiveOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
        "Access-Control-Allow-Headers":
          request.headers.get("access-control-request-headers") ||
          "Content-Type, Authorization, Cookie, X-Requested-With, sentry-trace, baggage, Accept",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      };

      if (url.pathname.startsWith("/api/auth")) {
        // Handle CORS preflight directly to avoid 404 on browser preflight checks
        if (request.method === "OPTIONS") {
          return new Response(null, {
            status: 204,
            headers: corsHeaders,
          });
        }

        try {
          const authInstance = getAuth(cfEnv, request);
          const response = await authInstance.handler(request);
          console.log(`[AUTH ${request.method}] ${url.pathname} - ${response.status}`);
          // Merge CORS headers so browser Network tab can inspect all responses
          const newHeaders = new Headers(response.headers);
          for (const [k, v] of Object.entries(corsHeaders)) {
            newHeaders.set(k, v);
          }

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        } catch (authError) {
          console.error(`[AUTH Error] ${request.method} ${url.pathname}:`, authError);
          const status =
            typeof (authError as any)?.statusCode === "number"
              ? (authError as any).statusCode
              : typeof (authError as any)?.status === "number"
              ? (authError as any).status
              : 500;

          const message =
            authError instanceof Error
              ? authError.message
              : typeof authError === "string"
              ? authError
              : "Authentication request failed";

          const bodyContent = (authError as any)?.body;
          const details =
            bodyContent && typeof bodyContent === "object"
              ? bodyContent
              : bodyContent
              ? String(bodyContent)
              : null;

          return new Response(
            JSON.stringify({
              success: false,
              error: message,
              details,
              status,
              path: url.pathname,
            }),
            {
              status,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json; charset=utf-8",
              },
            }
          );
        }
      }

      const startMs = Date.now();
      const handler = await getServerEntry();
      const isApiRequest =
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/_server") ||
        request.headers.get("accept")?.includes("application/json");

      const response = await handler.fetch(request, env, ctx);
      const normalizedResponse = isApiRequest
        ? response
        : await normalizeCatastrophicSsrResponse(response);
      const durationMs = Date.now() - startMs;
      console.log(`[HTTP ${request.method}] ${url.pathname} - ${normalizedResponse.status} (${durationMs}ms)`);
      return normalizedResponse;
    } catch (error) {
      if (isClientAbort(error)) {
        return new Response(null, { status: 499, statusText: "Client Closed Request" });
      }
      console.error(`[Server Error] ${request.method} ${request.url}:`, error);
      const url = new URL(request.url);
      const isApiRequest =
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/_server") ||
        request.headers.get("accept")?.includes("application/json");

      if (isApiRequest) {
        const reqOrigin = request.headers.get("origin") || "*";
        return new Response(
          JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Internal Server Error",
            path: url.pathname,
          }),
          {
            status: 500,
            headers: {
              "Access-Control-Allow-Origin": reqOrigin,
              "Access-Control-Allow-Credentials": "true",
              "Content-Type": "application/json; charset=utf-8",
            },
          }
        );
      }

      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
