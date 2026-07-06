import { describe, it, expect } from "vitest";
import { ChatResponseSchema, ConversationStateSchema } from "./conversation.js";
import { KnowledgeChunkSchema } from "./knowledge.js";

describe("data contracts", () => {
  it("ConversationState fills sensible defaults from {}", () => {
    const s = ConversationStateSchema.parse({});
    expect(s.intent).toBe("unknown");
    expect(s.language).toBe("id");
    expect(s.qualification.questionCount).toBe(0);
    expect(s.handoffOffered).toBe(false);
  });

  it("ChatResponse validates a well-formed payload", () => {
    const r = ChatResponseSchema.parse({
      answer: "Sari led the QuickHub project as tech lead.",
      intent: "explore",
      confidence: 0.8,
      evidence: [{ id: "quickhub", title: "QuickHub", type: "case_study", url: "https://demo.example/q" }],
      suggestedActions: [{ id: "contact", label: "Contact", type: "link", url: "https://demo.example/c" }],
    });
    expect(r.evidence).toHaveLength(1);
    expect(r.handoff).toBeNull();
    expect(r.qualification).toBeNull();
  });

  it("KnowledgeChunk requires url except for profile|skill|custom", () => {
    // case_study without url → invalid
    expect(
      KnowledgeChunkSchema.safeParse({
        id: "c1",
        type: "case_study",
        title: "X",
        visibility: "public",
        owner: "Demo",
        content: "body",
      }).success,
    ).toBe(false);

    // profile without url → valid
    expect(
      KnowledgeChunkSchema.safeParse({
        id: "p1",
        type: "profile",
        title: "Profile",
        visibility: "public",
        owner: "Demo",
        content: "body",
      }).success,
    ).toBe(true);
  });

  it("KnowledgeChunk rejects non-public visibility", () => {
    expect(
      KnowledgeChunkSchema.safeParse({
        id: "p1",
        type: "profile",
        title: "Profile",
        visibility: "private",
        owner: "Demo",
        content: "body",
      }).success,
    ).toBe(false);
  });
});
