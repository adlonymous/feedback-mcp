# Feedback MCP Server

> Built for the Cloudflare PM Build Challenge

An MCP (Model Context Protocol) server that helps product managers aggregate and analyze customer feedback from multiple sources using AI-powered semantic search and summarization.

## Live Demo

- **Landing Page:** https://feedback-mcp.adlonymous.workers.dev
- **MCP Server URL:** https://feedback-mcp.adlonymous.workers.dev/mcp

### Try it out

1. Go to [Cloudflare AI Playground](https://playground.ai.cloudflare.com)
2. Click **"MCP Servers"** in the left sidebar
3. Click **"Add MCP Server"** and paste: `https://feedback-mcp.adlonymous.workers.dev/mcp`
4. Ask questions like:
   - "What are people saying about R2?"
   - "Summarize P0 issues for Workers"
   - "Search for cold start complaints"

## Architecture

This project uses **5 Cloudflare Developer Platform products**:

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                             CLOUDFLARE EDGE NETWORK                                  │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────┐       ┌──────────────────────────────────────────────────────┐     │
│  │              │       │              WORKERS + DURABLE OBJECTS               │     │
│  │   MCP        │       │  ┌──────────────────────────────────────────────┐    │     │
│  │   Client     │◄─────►│  │           FeedbackMCP Agent                  │    │     │
│  │              │       │  │  • Handles MCP protocol (Streamable HTTP)    │    │     │
│  │  (Playground │       │  │  • Session state management                  │    │     │
│  │   or Claude) │       │  │  • Tool routing (search/summarize)           │    │     │
│  │              │       │  └──────────────────────────────────────────────┘    │     │
│  └──────────────┘       └──────────────────────────────────────────────────────┘     │
│                                          │                                           │
│                    ┌─────────────────────┼─────────────────────┐                     │
│                    │                     │                     │                     │
│                    ▼                     ▼                     ▼                     │
│  ┌────────────────────────────┐   ┌───────────┐   ┌─────────────────────────────┐   │
│  │         AUTORAG            │   │           │   │        WORKERS AI           │   │
│  │       (AI Search)          │   │    R2     │   │                             │   │
│  │                            │   │           │   │  ┌───────────────────────┐  │   │
│  │  ┌──────────────────────┐  │   │ feedback  │   │  │ bge-base-en-v1.5      │  │   │
│  │  │      VECTORIZE       │  │   │  .json    │   │  │ (embeddings)          │  │   │
│  │  │                      │  │   │           │   │  └───────────────────────┘  │   │
│  │  │  • Vector storage    │◄─┼───│ 250 items │   │  ┌───────────────────────┐  │   │
│  │  │  • Similarity search │  │   │           │   │  │ Llama 3.1 8B          │  │   │
│  │  │  • HNSW indexing     │  │   │ (source)  │   │  │ (summarization)       │  │   │
│  │  └──────────────────────┘  │   │           │   │  └───────────────────────┘  │   │
│  │                            │   │           │   │                             │   │
│  │  • Query rewriting         │   └───────────┘   └─────────────────────────────┘   │
│  │  • Managed RAG pipeline    │                                                     │
│  └────────────────────────────┘                                                     │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  User   │    │   MCP   │    │ AutoRAG │    │   R2    │    │ Workers │    │ Client  │
│  Query  │───►│ Server  │───►│ Search  │───►│  Data   │───►│   AI    │───►│Response │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                   │                                             │
                   │         (search tool - skip AI)             │
                   └─────────────────────────────────────────────┘
```

### Components

| Product | Purpose |
|---------|---------|
| **Workers + Durable Objects** | Hosts the MCP server using the [Cloudflare Agents SDK](https://github.com/cloudflare/agents). The `McpAgent` class handles MCP protocol via Streamable HTTP, with Durable Objects maintaining session state for each connection. |
| **R2** | Stores 250 mock feedback items as JSON. Zero-egress object storage for serving structured data. Also used by AutoRAG as the source for indexing. |
| **AutoRAG (AI Search)** | Managed RAG pipeline that powers semantic search. Handles document chunking, embedding generation, and vector search automatically. |
| **Vectorize** | Vector database used by AutoRAG behind the scenes to store and query embeddings for semantic similarity search. |
| **Workers AI** | Powers both embedding generation (via AutoRAG using `bge-base-en-v1.5`) and summarization (Llama 3.1 8B for extracting themes and insights). |

## MCP Tools

### `search`
Search feedback items using semantic search powered by AutoRAG.

**Parameters:**
- `query` (required) - Search query
- `source` - Filter: `support`, `discord`, `twitter`
- `status` - Filter: `new`, `in_progress`, `resolved`
- `urgency` - Filter: `P0`, `P1`, `P2`, `P3`
- `product` - Filter by product name
- `limit` - Max results (1-50, default 10)

### `summarize`
Generate AI-powered summaries of feedback matching your query.

**Parameters:**
- `query` (required) - Search query
- `source`, `status`, `urgency`, `product` - Same filters as search
- `maxItems` - Max items to include in summary (1-30, default 15)

## Mock Data

The server includes 250 simulated feedback items covering:

- **Sources:** Support tickets, Discord, Twitter
- **Products:** Workers, R2, Pages, D1, AI, Stream, Images, Zero Trust
- **Attributes:** Sentiment, urgency (P0-P3), status, timestamps

## Local Development

```bash
# Install dependencies
npm install

# Run locally (note: Durable Objects won't work locally)
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## Project Structure

```
├── src/
│   ├── worker.ts          # MCP server with Durable Object
│   ├── pages/
│   │   └── index.astro    # Landing page
│   └── layouts/
│       └── Layout.astro   # Base layout
├── data/
│   └── feedback.json      # Mock feedback data
├── scripts/
│   └── generate-feedback.ts  # Data generation script
├── wrangler.jsonc         # Cloudflare config
└── astro.config.mjs       # Astro config
```

## Configuration

The `wrangler.jsonc` configures:
- Durable Object binding for MCP sessions
- R2 bucket binding for feedback data
- AI binding for Workers AI and AutoRAG

## Files

- `FRICTIONLOG.md` - Development friction log documenting issues encountered
- `SESSION_CONTEXT.md` - Build session context and chunk planning

## Tech Stack

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare AutoRAG](https://developers.cloudflare.com/autorag/)
- [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/)
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Cloudflare Agents SDK](https://github.com/cloudflare/agents) - Powers the MCP server with `McpAgent` class and Durable Objects integration
- [MCP SDK](https://modelcontextprotocol.io/)
- [Astro](https://astro.build/)

## License

MIT
