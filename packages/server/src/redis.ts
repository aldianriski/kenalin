/**
 * Minimal Upstash Redis client over the REST API (TASK-007 / SPRINT-002 T1).
 *
 * We talk to Upstash's HTTP interface directly with `fetch` rather than pulling in
 * `@upstash/redis` — it's the same protocol the SDK wraps, keeps the dependency
 * surface thin, and runs on any runtime with `fetch` (Node ≥ 20, Vercel, Workers).
 * Only the subset the rate limiter + usage tracker need is implemented.
 *
 * Secrets (`UPSTASH_REDIS_REST_URL` / `_TOKEN`) enter only via env (PRD §D10).
 */

export interface RedisConfig {
  url: string;
  token: string;
}

/** The narrow surface the stores depend on — real client and the test fake share it. */
export interface RedisLike {
  /**
   * Execute commands as a single Upstash pipeline. Returns each command's result
   * in order; throws if any command errored or the request failed.
   */
  pipeline(commands: (string | number)[][]): Promise<unknown[]>;
}

/** Run a single command and return its result (sugar over `pipeline`). */
export async function redisCommand(
  redis: RedisLike,
  ...cmd: (string | number)[]
): Promise<unknown> {
  const [result] = await redis.pipeline([cmd]);
  return result;
}

interface UpstashRow {
  result?: unknown;
  error?: string;
}

export class UpstashRedis implements RedisLike {
  constructor(
    private readonly cfg: RedisConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async pipeline(commands: (string | number)[][]): Promise<unknown[]> {
    const res = await this.fetchImpl(`${this.cfg.url}/pipeline`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.cfg.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(commands),
    });
    if (!res.ok) {
      throw new Error(`upstash request failed: ${res.status}`);
    }
    const rows = (await res.json()) as UpstashRow[];
    return rows.map((row) => {
      if (row.error) throw new Error(`upstash command error: ${row.error}`);
      return row.result;
    });
  }
}

/**
 * Upstash returns a hash (HGETALL) as a flat `[field, value, field, value]` array.
 * Normalize to a plain object; tolerate an already-object shape defensively.
 */
export function hashToObject(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(raw)) {
    for (let i = 0; i + 1 < raw.length; i += 2) {
      out[String(raw[i])] = String(raw[i + 1]);
    }
  } else if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      out[k] = String(v);
    }
  }
  return out;
}
