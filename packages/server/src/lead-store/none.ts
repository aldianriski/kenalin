import type { Lead, LeadStore } from "@kenalin/core";

/** Default no-op store — nothing is persisted server-side (PRD B10, default). */
export class NoneLeadStore implements LeadStore {
  async save(_lead: Lead): Promise<void> {
    // intentionally does nothing
  }
}
