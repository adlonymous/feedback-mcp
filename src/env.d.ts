/// <reference types="astro/client" />

interface Env {
  MCP_OBJECT: DurableObjectNamespace;
  AI: Ai;
  ASSETS: Fetcher;
  FEEDBACK_BUCKET: R2Bucket;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
