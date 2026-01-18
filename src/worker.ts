import type { SSRManifest } from "astro";
import { App } from "astro/app";
import { handle } from "@astrojs/cloudflare/handler";
import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

interface Feedback {
  id: string;
  content: string;
  source: "support" | "discord" | "twitter";
  product: string;
  sentiment: "positive" | "neutral" | "negative";
  urgency: "P0" | "P1" | "P2" | "P3";
  status: "new" | "in_progress" | "resolved";
  timestamp: string;
}

const AUTORAG_NAME = "feedback-mcp";

export class FeedbackMCP extends McpAgent<Env> {
  server = new McpServer({
    name: "Feedback Investigation Server",
    version: "1.0.0",
  });

  private async loadFeedback(): Promise<Feedback[]> {
    const obj = await this.env.FEEDBACK_BUCKET.get("feedback.json");
    if (!obj) return [];
    const text = await obj.text();
    return JSON.parse(text) as Feedback[];
  }

  private filterFeedback(
    items: Feedback[],
    filters: {
      source?: string;
      status?: string;
      urgency?: string;
      product?: string;
    },
  ): Feedback[] {
    return items.filter((item) => {
      if (filters.source && item.source !== filters.source) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (filters.urgency && item.urgency !== filters.urgency) return false;
      if (filters.product && item.product !== filters.product) return false;
      return true;
    });
  }

  private textSearch(items: Feedback[], query: string): Feedback[] {
    const lowerQuery = query.toLowerCase();
    // Allow short terms like "R2", "AI", "D1"
    const terms = lowerQuery.split(/\s+/).filter((t) => t.length > 0);

    if (terms.length === 0) return [];

    return items
      .map((item) => {
        const content = item.content.toLowerCase();
        const matches = terms.filter((term) => content.includes(term)).length;
        return { item, score: matches / terms.length };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }

  async init() {
    this.server.tool(
      "search",
      "Search feedback items using semantic search. Optionally filter by source (support/discord/twitter), status (new/in_progress/resolved), urgency (P0/P1/P2/P3), or product.",
      {
        query: z
          .string()
          .describe("The search query to find relevant feedback"),
        source: z
          .enum(["support", "discord", "twitter"])
          .optional()
          .describe("Filter by feedback source"),
        status: z
          .enum(["new", "in_progress", "resolved"])
          .optional()
          .describe("Filter by status"),
        urgency: z
          .enum(["P0", "P1", "P2", "P3"])
          .optional()
          .describe("Filter by urgency level"),
        product: z.string().optional().describe("Filter by product name"),
        limit: z
          .number()
          .min(1)
          .max(50)
          .default(10)
          .describe("Maximum number of results to return"),
      },
      async ({ query, source, status, urgency, product, limit }) => {
        let results: Feedback[] = [];
        let searchMethod = "autorag";

        try {
          const autorag = this.env.AI.autorag(AUTORAG_NAME);
          const searchResult = await autorag.search({
            query,
            max_num_results: 50,
            rewrite_query: true,
          });

          const allFeedback = await this.loadFeedback();
          const feedbackMap = new Map(allFeedback.map((f) => [f.id, f]));

          results = searchResult.data
            .map((result: { filename: string }) => {
              const id = result.filename
                .replace(".json", "")
                .replace("feedback/", "");
              return feedbackMap.get(id);
            })
            .filter((f): f is Feedback => f !== undefined);
        } catch {
          searchMethod = "text";
          const allFeedback = await this.loadFeedback();
          results = this.textSearch(allFeedback, query);
        }

        results = this.filterFeedback(results, {
          source,
          status,
          urgency,
          product,
        });
        results = results.slice(0, limit);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  searchMethod,
                  totalResults: results.length,
                  filters: { source, status, urgency, product },
                  results: results.map((r) => ({
                    id: r.id,
                    content: r.content,
                    source: r.source,
                    product: r.product,
                    sentiment: r.sentiment,
                    urgency: r.urgency,
                    status: r.status,
                    timestamp: r.timestamp,
                  })),
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    this.server.tool(
      "summarize",
      "Generate an AI summary of feedback matching a search query. Returns a summary and the source feedback items used.",
      {
        query: z
          .string()
          .describe("The search query to find relevant feedback to summarize"),
        source: z
          .enum(["support", "discord", "twitter"])
          .optional()
          .describe("Filter by feedback source"),
        status: z
          .enum(["new", "in_progress", "resolved"])
          .optional()
          .describe("Filter by status"),
        urgency: z
          .enum(["P0", "P1", "P2", "P3"])
          .optional()
          .describe("Filter by urgency level"),
        product: z.string().optional().describe("Filter by product name"),
        maxItems: z
          .number()
          .min(1)
          .max(30)
          .default(15)
          .describe("Maximum feedback items to include in summary"),
      },
      async ({ query, source, status, urgency, product, maxItems }) => {
        let results: Feedback[] = [];

        try {
          // Use AutoRAG for semantic search
          const autorag = this.env.AI.autorag(AUTORAG_NAME);
          const searchResult = await autorag.search({
            query,
            max_num_results: 50,
            rewrite_query: true,
          });

          const allFeedback = await this.loadFeedback();
          const feedbackMap = new Map(allFeedback.map((f) => [f.id, f]));

          results = searchResult.data
            .map((result: { filename: string }) => {
              const id = result.filename
                .replace(".json", "")
                .replace("feedback/", "");
              return feedbackMap.get(id);
            })
            .filter((f): f is Feedback => f !== undefined);
        } catch {
          // Fallback to text search
          const allFeedback = await this.loadFeedback();
          results = this.textSearch(allFeedback, query);
        }

        // Apply filters
        results = this.filterFeedback(results, {
          source,
          status,
          urgency,
          product,
        });
        results = results.slice(0, maxItems);

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    summary:
                      "No feedback items found matching the query and filters.",
                    sourceCount: 0,
                    sources: [],
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        const feedbackContext = results
          .map(
            (r) =>
              `[${r.id}] (${r.source}, ${r.product}, ${r.urgency}, ${r.status}): "${r.content}"`,
          )
          .join("\n");

        const systemPrompt = `You are a product manager analyzing customer feedback. Summarize the key themes, issues, and requests from the feedback below. Be concise and actionable. Group by theme if appropriate. Highlight any P0/P1 urgent items.`;

        const userPrompt = `Query: "${query}"
Filters: source=${source || "any"}, status=${status || "any"}, urgency=${urgency || "any"}, product=${product || "any"}

Feedback items (${results.length} total):
${feedbackContext}

Provide a summary of the key themes and actionable insights from this feedback.`;

        const response = await this.env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct" as Parameters<Ai["run"]>[0],
          {
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 1024,
          },
        );

        const summary =
          typeof response === "object" &&
          response !== null &&
          "response" in response
            ? (response as { response: string }).response
            : String(response);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  summary,
                  sourceCount: results.length,
                  filters: { source, status, urgency, product },
                  sources: results.map((r) => ({
                    id: r.id,
                    content: r.content,
                    source: r.source,
                    product: r.product,
                    urgency: r.urgency,
                    status: r.status,
                  })),
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );
  }
}

const mcpHandler = FeedbackMCP.serve("/mcp");

export function createExports(manifest: SSRManifest) {
  const app = new App(manifest);

  return {
    default: {
      async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext,
      ): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
          return mcpHandler.fetch(request as unknown as Request, env, ctx);
        }

        if (url.pathname === "/api/test-r2") {
          try {
            const obj = await env.FEEDBACK_BUCKET.get("feedback.json");
            if (!obj) {
              return new Response(
                JSON.stringify({ error: "feedback.json not found in R2" }),
                {
                  status: 404,
                  headers: { "Content-Type": "application/json" },
                },
              );
            }
            const text = await obj.text();
            const data = JSON.parse(text) as Array<{ id: string }>;
            return new Response(
              JSON.stringify({
                success: true,
                totalItems: data.length,
                sampleIds: data.slice(0, 5).map((d) => d.id),
              }),
              {
                headers: { "Content-Type": "application/json" },
              },
            );
          } catch (error) {
            return new Response(JSON.stringify({ error: String(error) }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        if (url.pathname === "/api/test-autorag") {
          try {
            const autorag = env.AI.autorag(AUTORAG_NAME);
            const searchResult = await autorag.search({
              query: "Workers performance issues",
              max_num_results: 5,
            });
            return new Response(
              JSON.stringify({
                success: true,
                autoragName: AUTORAG_NAME,
                query: "Workers performance issues",
                resultCount: searchResult.data?.length || 0,
                results: searchResult.data || [],
                message: "AI Search is working!",
              }),
              {
                headers: { "Content-Type": "application/json" },
              },
            );
          } catch (error) {
            return new Response(
              JSON.stringify({
                error: String(error),
                message: "AI Search instance not found or not configured. Create via dashboard.",
                dashboardUrl: "https://dash.cloudflare.com/?to=/:account/ai/ai-search",
                hint: `Looking for autorag instance named: ${AUTORAG_NAME}`,
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
        }

        return handle(manifest, app, request as any, env as any, ctx);
      },
    } satisfies ExportedHandler<Env>,
    FeedbackMCP,
  };
}
