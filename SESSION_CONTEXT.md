# Feedback MCP Server - Session Context

## Project Overview

Building an MCP server for PM feedback aggregation/analysis. The server helps PMs track product feedback from support tickets, Discord, and Twitter. It operates under the assumption that Slack/Linear integrations update the data store - we demonstrate different states via mock data.

This is for a **Cloudflare PM Build Challenge**.

## Architecture

### Stack

| Product | Purpose |
|---------|---------|
| Workers | Host MCP server |
| R2 | Store feedback data (JSON) |
| AutoRAG | Semantic search over ~250 feedback items |

### MCP Tools (2 only)

| Tool | Description |
|------|-------------|
| `search` | Semantic search via AutoRAG + filters (source, status, urgency). Returns relevant feedback items. |
| `summarize` | AI summary of feedback matching a query. Returns summary + source items used. |

### Data Model

```typescript
interface Feedback {
  id: string;
  content: string;
  source: 'support' | 'discord' | 'twitter';
  product: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'new' | 'in_progress' | 'resolved';
  timestamp: string;
}
```

## Build Chunks (Execution Plan)

| Chunk | Description | Status |
|-------|-------------|--------|
| 1 | Mock Data - 250 items with sources (support/discord/twitter), statuses (new/in_progress/resolved), rich multi-sentence content | ✅ COMPLETE |
| 2 | R2 Setup - Upload expanded data, verify R2 binding works | ✅ COMPLETE |
| 3 | AutoRAG Setup - Create AutoRAG instance, index feedback from R2 | ✅ COMPLETE |
| 4 | MCP `search` tool - Query AutoRAG + filters, return feedback items | ✅ COMPLETE |
| 5 | MCP `summarize` tool - Search + Workers AI summary, return summary + source items | ✅ COMPLETE |
| 6 | Astro Frontend - Simple UI to test MCP tools (not an agentic chatbot) | ⏳ PENDING |
| 7 | Deploy + Test | ⏳ PENDING |

## Current Codebase State

### Key Files

| File | Description | Status |
|------|-------------|--------|
| `src/worker.ts` | MCP server with only a `ping` tool | Needs `search` and `summarize` |
| `wrangler.jsonc` | Has R2 bucket binding (`FEEDBACK_BUCKET`) and AI binding | May need AutoRAG binding |
| `data/feedback.json` | 250 mock feedback items | ✅ Generated |
| `scripts/generate-feedback.ts` | Script to generate mock data | ✅ Updated |
| `src/pages/index.astro` | Blank Astro page | Needs test UI |
| `src/pages/api/mcp/*` | Old MCP proxy endpoints | May need cleanup |

### wrangler.jsonc Configuration

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "feedback-mcp",
  "main": "dist/_worker.js/index.js",
  "compatibility_date": "2025-01-15",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "dist",
    "binding": "ASSETS"
  },
  "durable_objects": {
    "bindings": [
      {
        "name": "MCP_OBJECT",
        "class_name": "FeedbackMCP"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["FeedbackMCP"]
    }
  ],
  "ai": {
    "binding": "AI"
  },
  "r2_buckets": [
    {
      "binding": "FEEDBACK_BUCKET",
      "bucket_name": "feedback-mcp-data"
    }
  ]
}
```

### Current worker.ts

```typescript
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import { handle } from '@astrojs/cloudflare/handler';
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export class FeedbackMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "Feedback Investigation Server",
    version: "1.0.0",
  });

  async init() {
    this.server.tool(
      "ping",
      "Test tool - returns pong",
      {},
      async () => {
        return {
          content: [{ type: "text" as const, text: "pong" }],
        };
      }
    );
  }
}

const mcpHandler = FeedbackMCP.serve("/mcp");

export function createExports(manifest: SSRManifest) {
  const app = new App(manifest);
  
  return {
    default: {
      async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
          return mcpHandler.fetch(request, env, ctx);
        }

        return handle(manifest, app, request, env, ctx);
      },
    } satisfies ExportedHandler<Env>,
    FeedbackMCP,
  };
}
```

## Generated Data Summary (Chunk 1 Complete)

**250 feedback entries generated with:**

### Distribution by Source
- support: 83
- discord: 90
- twitter: 77

### Distribution by Status
- new: 115
- in_progress: 80
- resolved: 55

### Distribution by Product
- workers: 52
- r2: 53
- pages: 49
- d1: 44
- ai: 52

### Distribution by Sentiment
- positive: 83
- negative: 108
- neutral: 59

### Distribution by Urgency
- P0: 17
- P1: 57
- P2: 101
- P3: 75

### Sample Feedback Entry

```json
{
  "id": "fb_001",
  "content": "R2 performance is solid for our CDN use case. We use R2 for static asset hosting and the TTFB is consistently excellent. Combined with Cache Reserve, we're seeing sub-20ms responses for cached content worldwide.",
  "source": "twitter",
  "product": "r2",
  "sentiment": "positive",
  "urgency": "P3",
  "status": "resolved",
  "timestamp": "2024-12-31T03:00:00.000Z"
}
```

## Products Covered in Feedback

1. **Workers** - Cold starts, CPU limits, WebSockets, Durable Objects, KV, Smart Placement, TypeScript support, cron triggers
2. **R2** - Egress pricing, multipart uploads, presigned URLs, event notifications, lifecycle policies, dashboard, S3 compatibility, monitoring
3. **Pages** - Build times, preview deployments, monorepo support, functions integration, framework support, custom domains, caching, analytics
4. **D1** - Transactions, performance, migrations, branching, size limits, backups, Drizzle ORM, full-text search
5. **AI** - Inference speed, model options, fine-tuning, AI Gateway, Vectorize integration, rate limiting, pricing, streaming

## Requirements

- Host on Cloudflare Workers ✅
- Use 2-3 Cloudflare products (Workers, R2, AutoRAG)
- Mock data is fine ✅
- Provide architecture overview

## Next Steps

Ready to proceed with Chunk 4 (MCP search tool implementation).

---

## Chunk 3 Complete - AutoRAG Setup

**Completed:**
- ✅ Split 250 feedback items into individual JSON files (fb_001.json - fb_250.json)
- ✅ Uploaded all 250 files to R2 in `feedback/` directory
- ✅ Verified AI Search instance "feedback-mcp" exists and is working

**Files created:**
- `scripts/split-feedback-for-autorag.ts` - Splits feedback.json into individual files
- `scripts/upload-feedback-to-r2.ts` - Uploads individual files to R2
- `data/feedback/` directory with 250 individual feedback JSON files

**AI Search Discovery:**
- AI Search instance **"feedback-mcp"** was already created and indexed
- Tested via `/api/test-autorag` endpoint - semantic search works
- Query "Workers performance issues" returned 4 relevant results:
  - fb_144: Fine-tuning support for Workers AI (discord, P1, new)
  - fb_143: Debugging tools for Durable Objects (twitter, P1, new)
  - fb_147: Fine-tuning for enterprise (discord, P1, resolved)
  - fb_145: Domain-specific data for fine-tuning (discord, P1, resolved)

**Test endpoints:**
- `GET /api/test-r2` - Verifies R2 binding works (returns 250 items)
- `GET /api/test-autorag` - Verifies AI Search binding works (semantic search)

**Note on AI Search/AutoRAG naming:**
- Product renamed "AutoRAG" → "AI Search"
- API still uses `env.AI.autorag(instanceName)` (backward compatibility)
- No CLI support for creation - must use Cloudflare Dashboard
- Instance discovered via testing, not documentation

---

## Chunk 2 Complete - R2 Setup

**Completed:**
- ✅ Verified R2 bucket `feedback-mcp-data` exists
- ✅ Uploaded `data/feedback.json` (250 items) to R2
- ✅ Added `/api/test-r2` endpoint to verify R2 binding works
- ✅ Deployed and tested - R2 binding verified (returns 250 items)

**Test endpoint:** https://feedback-mcp.adlonymous.workers.dev/api/test-r2

User instruction: "for each chunk, execute it only after I tell you to do so"
