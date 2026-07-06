import { createHmac } from "node:crypto";
import type { WebhookEvent } from "@kenalin/core";

/**
 * Generic outbound webhook emitter (PRD D8). Vendor-neutral JSON, signed with
 * X-Kenalin-Signature: hex(hmac_sha256(body, secret)). 3 retries with backoff.
 */
export interface WebhookConfig {
  url: string;
  secret?: string;
}

export function signPayload(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

const RETRIES = 3;
const BASE_DELAY_MS = 250;

export class WebhookEmitter {
  constructor(
    private readonly config: WebhookConfig,
    private readonly log?: (e: Record<string, unknown>) => void,
    private readonly sleep: (ms: number) => Promise<void> = (ms) =>
      new Promise((r) => setTimeout(r, ms)),
  ) {}

  async emit(event: WebhookEvent): Promise<boolean> {
    const body = JSON.stringify(event);
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (this.config.secret) headers["x-kenalin-signature"] = signPayload(body, this.config.secret);

    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      try {
        const res = await fetch(this.config.url, { method: "POST", headers, body });
        if (res.ok) return true;
        this.log?.({ event: "webhook_non_2xx", status: res.status, attempt, name: event.event });
      } catch (err) {
        this.log?.({ event: "webhook_error", error: String(err), attempt, name: event.event });
      }
      if (attempt < RETRIES) await this.sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
    }
    return false;
  }
}
