# Cloudflare Developer Platform Friction Log - 01/15/2026 (Aadil Ahmed)

## Template

- Title: Concise name of the issue
- Problem: Describe what happened or what you noticed. Was it a technical bug, a confusing UI element, or a gap in documentation? How did it slow you down?
- Suggestion: As a PM, how would you fix this? Is it a UI change, a new documentation section, a better error message, or a completely new feature?

## Issue 1

- Title: Lack of MCP Server Worker Templates in workers.new/templates
- Problem: There aren't any quick-start guides for MCP servers in the Workers templates catalogue. Having this would make 0 -> 1 in this project way quicker instead of having to use Cloudflare MCP Server for it to access the MCP part of the documentation, which made me spend more time on this than it should've taken. Ran into issues trying to set up Legacy SSE support
- Suggestion: Publish a barebones MCP Server template to the Workers template library. Should handle both Streamable HTTP and Server-Sent Events (Legacy support), along with a landing page in the root (/) which describes how to configure an MCP server.

## Issue 2

- Title: Lack of Projects view in dashboard
- Problem: It's hard to manage different Workers, D1/R2 instances and other Cloudflare product offerings without being able to organize them according to a project. When building a multi-service app (Worker + D1 + R2 + Durable Objects), each resource appears separately in the dashboard with no way to group them.
- Suggestion: Introduce a "Projects" concept in the dashboard that groups related resources (Workers, D1, R2, KV, DO) together. Similar to how Vercel groups deployments under a project.

## Issue 3

- Title: Fetching between Workers doesn't work by default
- Problem: Fetching between Workers doesn't work by default and throws a 1042 Worker Error Code unless 'global fetch strictly public' compatibility flag is used, and the way to select this in the Cloudflare dashboard is unintuitive and the flag doesn't show up in the dropdown where I'm supposed to select it. I have to type out the flag from memory and after I do that, there is nothing to reassure me that it is a valid flag.
- Suggestion: Make the flag easier to choose on the dashboard - either by having it be a separate heading under 'Runtime' in Worker Settings, having the flag be something that shows in the dropdown menu, or most ideally making fetching between Workers enabled by default.

## Issue 4

- Title: Improvements needed for D1 interface for viewing SQLite data
- Problem: The D1 console in the dashboard is basic - no visual schema explorer, limited query history, and no way to export query results easily. When debugging, you have to repeatedly type queries.
- Suggestion: Add a visual schema explorer showing tables/columns, saved queries feature, and CSV/JSON export for query results.

## Issue 5

- Title: Lack of UI dashboard for Workflows
- Problem: Workflows don't have a dedicated dashboard view to see running instances, step progress, or debug failed runs. You have to rely on logs to understand workflow state.
- Suggestion: Add a Workflows dashboard similar to Queues that shows active/completed/failed workflow instances with drill-down into step-level details.

## Issue 6

- Title: Can't delete R2 bucket without deleting everything inside it
- Problem: The dashboard requires you to manually delete all objects before deleting a bucket. For buckets with many objects, this is tedious and time-consuming.
- Suggestion: Add a "Force delete bucket and all contents" option with appropriate confirmation warnings.

## Issue 7

- Title: AI Search can't use D1 as a data source
- Problem: AI Search/AutoRAG only supports R2 as a data source, not D1. Many apps store structured data in D1 that would benefit from semantic search.
- Suggestion: Add D1 as a supported data source for AI Search, allowing semantic queries over database content.

## Issue 8

- Title: Astro + Cloudflare Adapter workerEntryPoint documentation is sparse
- Problem: The `workerEntryPoint` option in `@astrojs/cloudflare` adapter is powerful but under-documented. It allows you to combine a custom Worker (with Durable Objects, API routes, etc.) alongside Astro pages, but figuring out the correct configuration required trial and error. The option exists but examples of combining custom Workers with Astro are hard to find.
- Suggestion: Add a dedicated guide showing how to use `workerEntryPoint` to add Durable Objects, R2 bindings, and custom API routes alongside Astro pages. Include a complete example in Astro + Cloudflare integration docs.

## Issue 9

- Title: R2 local vs remote data sync requires manual uploads to both
- Problem: When using `wrangler dev`, local R2 storage is separate from remote. You have to run `wrangler r2 object put` twice - once with `--local` and once with `--remote` - to ensure data exists in both environments. There's no sync command or warning when data differs.
- Suggestion: Add a `wrangler r2 sync` command to push/pull objects between local and remote. Or at minimum, warn when `wrangler dev` accesses an object that exists remotely but not locally.

## Issue 10

- Title: Workers AI function calling tool_calls format requires careful handling
- Problem: When using Workers AI with function calling (tools), the response format for `tool_calls` can vary. Sometimes `arguments` is a string that needs JSON parsing, sometimes it's already an object. The documentation doesn't clearly specify the expected format, leading to runtime errors when parsing tool arguments.
- Suggestion: Standardize the `tool_calls` response format in Workers AI and document it clearly. Always return `arguments` as a parsed object, or always as a string - but be consistent and document it.

## Issue 11

- Title: No MCP server examples in Workers AI documentation
- Problem: The Workers AI docs focus on direct API usage but don't show how to build an MCP server that uses Workers AI as the LLM backend. With MCP becoming more popular, developers need guidance on this architecture pattern.
- Suggestion: Add a guide titled "Building an MCP Server with Workers AI" that shows the complete pattern: MCP tool definitions, Workers AI for reasoning, and tool execution flow.

## Issue 12

- Title: AI Search lacks CLI support and has confusing naming
- Problem: AI Search instances can only be created via the dashboard (no `wrangler` CLI), breaking infrastructure-as-code workflows. The product is branded "AI Search" but the API method is `autorag()`, causing confusion when writing code.
- Suggestion: Add `wrangler ai-search create/list/delete` commands. Either rename the API to `aiSearch()` or document why it differs from the product name.
