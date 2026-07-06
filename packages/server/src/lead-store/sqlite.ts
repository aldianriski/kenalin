import type { Lead, LeadStore } from "@kenalin/core";

/**
 * SQLite lead store (PRD D4, P0-lite) using Node's built-in `node:sqlite`.
 * Loaded dynamically so environments without it (or without the experimental
 * flag) fail with a clear message rather than at import time.
 */
export class SqliteLeadStore implements LeadStore {
  private constructor(
    private readonly db: SqliteDb,
    private readonly retentionDays: number,
  ) {}

  static async open(path: string, retentionDays = 30): Promise<SqliteLeadStore> {
    let DatabaseSync: new (p: string) => SqliteDb;
    try {
      ({ DatabaseSync } = (await import("node:sqlite")) as unknown as {
        DatabaseSync: new (p: string) => SqliteDb;
      });
    } catch {
      throw new Error(
        "storage.lead 'database' requires node:sqlite (Node ≥ 22.5, run with --experimental-sqlite if needed) " +
          "or swap in a webhook/none store.",
      );
    }
    const db = new DatabaseSync(path);
    db.exec(
      `CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY, createdAt TEXT NOT NULL, sessionId TEXT NOT NULL,
        intent TEXT, category TEXT, complexity TEXT, contact TEXT, brief TEXT, source TEXT
      )`,
    );
    return new SqliteLeadStore(db, retentionDays);
  }

  async save(lead: Lead): Promise<void> {
    const stmt = this.db.prepare(
      `INSERT OR REPLACE INTO leads (id, createdAt, sessionId, intent, category, complexity, contact, brief, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    stmt.run(
      lead.id,
      lead.createdAt,
      lead.sessionId,
      lead.intent,
      lead.category ?? null,
      lead.complexity ?? null,
      lead.contact ? JSON.stringify(lead.contact) : null,
      lead.brief,
      JSON.stringify(lead.source),
    );
    this.prune();
  }

  /** Best-effort retention enforcement (PRD B10 retentionDays). */
  private prune(): void {
    const cutoff = new Date(Date.now() - this.retentionDays * 86_400_000).toISOString();
    try {
      this.db.prepare("DELETE FROM leads WHERE createdAt < ?").run(cutoff);
    } catch {
      /* non-fatal */
    }
  }
}

interface SqliteStatement {
  run(...params: (string | number | null)[]): unknown;
}
interface SqliteDb {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
}
