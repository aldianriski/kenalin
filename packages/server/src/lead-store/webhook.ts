import type { Lead, LeadStore, WebhookEvent } from "@kenalin/core";
import type { WebhookEmitter } from "../webhook.js";

/** Emits a `lead.created` webhook event instead of storing locally. */
export class WebhookLeadStore implements LeadStore {
  constructor(private readonly emitter: WebhookEmitter) {}

  async save(lead: Lead): Promise<void> {
    const event: WebhookEvent = {
      event: "lead.created",
      timestamp: lead.createdAt,
      sessionId: lead.sessionId,
      data: lead,
    };
    await this.emitter.emit(event);
  }
}

/** A composite that fans a lead out to several stores (e.g. database + webhook). */
export class CompositeLeadStore implements LeadStore {
  constructor(private readonly stores: LeadStore[]) {}
  async save(lead: Lead): Promise<void> {
    await Promise.all(this.stores.map((s) => s.save(lead)));
  }
}
