#!/usr/bin/env node
/**
 * PostPilot — Database Migration Script
 *
 * Run with:  npx tsx src/lib/db/migrate.ts
 *
 * Uses DATABASE_URL_UNPOOLED (Neon direct connection) for migrations
 * since DDL statements can't run over the HTTP/pooled transport.
 */

import { neon } from "@neondatabase/serverless";
import { SCHEMA_SQL } from "./schema.js";

try {
  process.loadEnvFile?.();
} catch {}

function splitSqlStatements(sqlText: string): string[] {
  // Strip comments so apostrophes inside comments don't break quote parsing
  const cleanSql = sqlText
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--.*$/gm, "");

  const statements: string[] = [];
  let current = "";
  let inDollarQuote = false;
  let inSingleQuote = false;

  for (let i = 0; i < cleanSql.length; i++) {
    const char = cleanSql[i];
    const nextChar = cleanSql[i + 1];

    if (char === "'" && !inDollarQuote) {
      inSingleQuote = !inSingleQuote;
      current += char;
    } else if (char === "$" && nextChar === "$" && !inSingleQuote) {
      inDollarQuote = !inDollarQuote;
      current += "$$";
      i++;
    } else if (char === ";" && !inDollarQuote && !inSingleQuote) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = "";
    } else {
      current += char;
    }
  }

  const trimmed = current.trim();
  if (trimmed) statements.push(trimmed);
  return statements;
}

async function migrate() {
  const url = process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"];
  if (!url) {
    console.error("❌  Set DATABASE_URL_UNPOOLED in your environment before running migrations.");
    process.exit(1);
  }

  console.log("🔄  Connecting to Neon...");
  const sql = neon(url);

  console.log("🔄  Running schema migrations...");

  const statements = splitSqlStatements(SCHEMA_SQL);
  let succeeded = 0;
  let failed = 0;

  for (const stmt of statements) {
    try {
      await sql.query(stmt);
      succeeded++;
    } catch (err) {
      console.warn(`⚠️  Statement warning:\n   ${err}\n   SQL: ${stmt.slice(0, 80)}...`);
      failed++;
    }
  }

  console.log(`✅  Migration complete — ${succeeded} statements succeeded, ${failed} warnings.`);
  process.exit(failed > 0 ? 1 : 0);
}

migrate().catch((err) => {
  console.error("❌  Migration failed:", err);
  process.exit(1);
});
