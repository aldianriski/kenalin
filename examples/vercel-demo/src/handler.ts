/**
 * Keyless demo API. Assembles the real Kenalin Hono app (createApp) with the
 * offline providers — HashEmbeddingProvider + FakeChatProvider(demoResponder) —
 * over a prebuilt hash index. esbuild bundles this file (core + server + hono +
 * zod + the index, all inlined) into the Vercel function `api/[...path].mjs`, so
 * the deploy has no workspace/npm dependency and needs no secrets.
 */
import { loadConfig, type KnowledgeChunk } from "@kenalin/core";
import {
  LocalKnowledgeStore,
  HashEmbeddingProvider,
  FakeChatProvider,
  createApp,
} from "@kenalin/server";
import { handle } from "hono/vercel";
import rawConfig from "./kenalin.config.js";
import { demoResponder } from "./responder.js";
import chunks from "./chunks.json";

const config = loadConfig(rawConfig);
const store = LocalKnowledgeStore.fromChunks(chunks as unknown as KnowledgeChunk[]);

const app = createApp({
  config,
  store,
  embedder: new HashEmbeddingProvider(),
  chat: new FakeChatProvider(demoResponder),
  // Hash embedder needs a low cosine floor (see factory.ts calibration).
  retrievalThreshold: 0.08,
});

// `export default` covers all methods for a raw Vercel (Web-signature) function;
// the named exports cover the App-Router convention. Both delegate to the app.
const vercelHandler = handle(app);
export default vercelHandler;
export const GET = vercelHandler;
export const POST = vercelHandler;
export const OPTIONS = vercelHandler;

