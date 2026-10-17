/**
 * PostPilot — Terminal Logger
 *
 * Provides clean, structured, and informative logs for all API calls:
 * - AI generation (Ideogram, Groq, OpenAI)
 * - Social publishing (Zernio, Instagram)
 * - Storage (Supabase Storage CDN)
 * - Database operations (Neon Postgres)
 * - Auth and Accounts
 *
 * NOTE: API keys and sensitive tokens are NEVER logged.
 */

function timestamp(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

export const log = {
  ai: (provider: "Ideogram" | "Groq" | "OpenAI", message: string, details?: Record<string, unknown>) => {
    const time = `${colors.dim}[${timestamp()}]${colors.reset}`;
    const tag = `${colors.magenta}${colors.bold}[AI:${provider}]${colors.reset}`;
    let extra = "";
    if (details) {
      const parts = Object.entries(details)
        .filter(([_, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${colors.dim}${k}=${colors.reset}${typeof v === "object" ? JSON.stringify(v) : v}`);
      if (parts.length > 0) extra = ` | ${parts.join(" · ")}`;
    }
    console.log(`${time} ${tag} ${message}${extra}`);
  },

  publish: (platform: string, message: string, details?: Record<string, unknown>) => {
    const time = `${colors.dim}[${timestamp()}]${colors.reset}`;
    const tag = `${colors.green}${colors.bold}[Publish:${platform}]${colors.reset}`;
    let extra = "";
    if (details) {
      const parts = Object.entries(details)
        .filter(([_, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${colors.dim}${k}=${colors.reset}${typeof v === "object" ? JSON.stringify(v) : v}`);
      if (parts.length > 0) extra = ` | ${parts.join(" · ")}`;
    }
    console.log(`${time} ${tag} ${message}${extra}`);
  },

  storage: (action: string, message: string, details?: Record<string, unknown>) => {
    const time = `${colors.dim}[${timestamp()}]${colors.reset}`;
    const tag = `${colors.cyan}${colors.bold}[Storage:${action}]${colors.reset}`;
    let extra = "";
    if (details) {
      const parts = Object.entries(details)
        .filter(([_, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${colors.dim}${k}=${colors.reset}${typeof v === "object" ? JSON.stringify(v) : v}`);
      if (parts.length > 0) extra = ` | ${parts.join(" · ")}`;
    }
    console.log(`${time} ${tag} ${message}${extra}`);
  },

  db: (action: string, message: string, details?: Record<string, unknown>) => {
    const time = `${colors.dim}[${timestamp()}]${colors.reset}`;
    const tag = `${colors.blue}${colors.bold}[DB:${action}]${colors.reset}`;
    let extra = "";
    if (details) {
      const parts = Object.entries(details)
        .filter(([_, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${colors.dim}${k}=${colors.reset}${typeof v === "object" ? JSON.stringify(v) : v}`);
      if (parts.length > 0) extra = ` | ${parts.join(" · ")}`;
    }
    console.log(`${time} ${tag} ${message}${extra}`);
  },

  account: (action: string, message: string, details?: Record<string, unknown>) => {
    const time = `${colors.dim}[${timestamp()}]${colors.reset}`;
    const tag = `${colors.yellow}${colors.bold}[Account:${action}]${colors.reset}`;
    let extra = "";
    if (details) {
      const parts = Object.entries(details)
        .filter(([_, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${colors.dim}${k}=${colors.reset}${typeof v === "object" ? JSON.stringify(v) : v}`);
      if (parts.length > 0) extra = ` | ${parts.join(" · ")}`;
    }
    console.log(`${time} ${tag} ${message}${extra}`);
  },
};
