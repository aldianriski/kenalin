import { join } from "node:path";
import type { KenalinConfig, LeadStore } from "@kenalin/core";
import { NoneLeadStore } from "./none.js";
import { WebhookLeadStore, CompositeLeadStore } from "./webhook.js";
import { SqliteLeadStore } from "./sqlite.js";
import { WebhookEmitter } from "../webhook.js";

export { NoneLeadStore } from "./none.js";
export { WebhookLeadStore, CompositeLeadStore } from "./webhook.js";
export { SqliteLeadStore } from "./sqlite.js";

export interface SelectLeadStoreOptions {
  /** Webhook signing secret (from env, not config file). */
  webhookSecret?: string;
  /** Directory for the SQLite file (default cwd). */
  dataDir?: string;
  log?: (e: Record<string, unknown>) => void;
}

/** Build the LeadStore for the configured mode (PRD D4: none | database | webhook | both). */
export async function selectLeadStore(
  config: KenalinConfig,
  opts: SelectLeadStoreOptions = {},
): Promise<LeadStore> {
  const mode = config.storage.lead;
  const makeWebhook = (): WebhookLeadStore => {
    if (!config.handoff.webhook) {
      throw new Error(`storage.lead '${mode}' requires handoff.webhook to be configured`);
    }
    return new WebhookLeadStore(
      new WebhookEmitter(
        { url: config.handoff.webhook.url, secret: opts.webhookSecret },
        opts.log,
      ),
    );
  };
  const makeSqlite = () =>
    SqliteLeadStore.open(join(opts.dataDir ?? process.cwd(), "kenalin-leads.sqlite"), config.storage.retentionDays);

  switch (mode) {
    case "none":
      return new NoneLeadStore();
    case "webhook":
      return makeWebhook();
    case "database":
      return makeSqlite();
    case "both":
      return new CompositeLeadStore([await makeSqlite(), makeWebhook()]);
    default:
      return new NoneLeadStore();
  }
}
