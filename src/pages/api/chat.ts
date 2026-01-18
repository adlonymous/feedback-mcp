import type { APIRoute } from 'astro';

interface FeedbackItem {
  id: string;
  content: string;
  source: string;
  product: string;
  sentiment: string;
  urgency: string;
  timestamp: string;
  status: string;
}

let feedbackCache: FeedbackItem[] | null = null;

async function loadFeedback(bucket: R2Bucket): Promise<FeedbackItem[]> {
  if (feedbackCache) return feedbackCache;
  
  try {
    const obj = await bucket.get('feedback.json');
    if (!obj) {
      console.error('feedback.json not found in R2');
      return [];
    }
    const data = await obj.json() as FeedbackItem[];
    feedbackCache = data;
    return data;
  } catch (e) {
    console.error('Failed to load feedback from R2:', e);
    return [];
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  
  try {
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tools = [
      {
        name: "searchFeedback",
        description: "Search product feedback by query, optionally filter by status or product",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            status: { type: "string", enum: ["queued", "in_progress", "done"] },
            product: { type: "string", enum: ["workers", "r2", "pages", "d1", "ai"] }
          },
          required: ["query"]
        }
      },
      {
        name: "getQueue",
        description: "Get all feedback items in the queue that need triage",
        parameters: {
          type: "object",
          properties: {
            product: { type: "string", enum: ["workers", "r2", "pages", "d1", "ai"] }
          }
        }
      },
      {
        name: "searchDocs",
        description: "Search Cloudflare documentation for context on a product or feature",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Documentation search query" }
          },
          required: ["query"]
        }
      },
      {
        name: "investigate",
        description: "Deep investigation of a feedback topic, combining feedback data with docs context",
        parameters: {
          type: "object",
          properties: {
            question: { type: "string", description: "The topic to investigate" }
          },
          required: ["question"]
        }
      },
      {
        name: "updateStatus",
        description: "Update the status of a feedback item",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Feedback item ID" },
            status: { type: "string", enum: ["queued", "in_progress", "done"] }
          },
          required: ["id", "status"]
        }
      }
    ];

    const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        {
          role: "system",
          content: `You are a helpful PM assistant for analyzing product feedback. You have access to tools to search feedback, view the triage queue, search documentation, and investigate issues. Use the tools when needed to answer user questions. Be concise and helpful.`
        },
        {
          role: "user",
          content: message
        }
      ],
      tools,
      max_tokens: 1024
    });

    const toolCalls: Array<{ name: string; result: string }> = [];
    let finalResponse = '';

    if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
      const feedback = await loadFeedback(env.FEEDBACK_BUCKET);
      
      for (const toolCall of aiResponse.tool_calls) {
        const toolName = toolCall.name;
        const toolArgs = toolCall.arguments;
        
        const result = await executeTool(toolName, toolArgs, feedback, env);
        toolCalls.push({ name: toolName, result });
      }

      const followUp = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content: "You are a helpful PM assistant. Summarize the tool results for the user in a clear, actionable way. Focus on insights and recommendations."
          },
          {
            role: "user",
            content: message
          },
          {
            role: "assistant",
            content: `I used these tools: ${toolCalls.map(tc => tc.name).join(', ')}`
          },
          {
            role: "user",
            content: `Tool results:\n${toolCalls.map(tc => `${tc.name}: ${tc.result}`).join('\n\n')}\n\nPlease summarize this for me.`
          }
        ],
        max_tokens: 1024
      });

      finalResponse = followUp.response || '';
    } else {
      finalResponse = aiResponse.response || 'I can help you search feedback, view your queue, or investigate issues. What would you like to know?';
    }

    return new Response(JSON.stringify({ 
      response: finalResponse,
      toolCalls 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function executeTool(
  toolName: string, 
  args: Record<string, unknown>, 
  feedback: FeedbackItem[],
  env: Env
): Promise<string> {
  switch (toolName) {
    case "getQueue": {
      const product = args.product as string | undefined;
      let items = feedback.filter(f => f.status === "queued");
      if (product) items = items.filter(f => f.product === product);
      items = items.slice(0, 10);
      return JSON.stringify(items, null, 2);
    }
    
    case "searchFeedback": {
      const query = (args.query as string || '').toLowerCase();
      const status = args.status as string | undefined;
      const product = args.product as string | undefined;
      
      let items = feedback.filter(f => 
        f.content.toLowerCase().includes(query) ||
        f.product.includes(query)
      );
      if (status) items = items.filter(f => f.status === status);
      if (product) items = items.filter(f => f.product === product);
      items = items.slice(0, 10);
      return JSON.stringify(items, null, 2);
    }
    
    case "searchDocs": {
      const query = args.query as string || '';
      try {
        const searchResults = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
          text: [query]
        });
        
        const mockDocs = [
          { title: "Workers Cold Starts", content: "Workers run on Cloudflare's global network. Cold starts can be minimized using Smart Placement or keeping workers warm with scheduled triggers." },
          { title: "R2 Pricing", content: "R2 has zero egress fees. You only pay for storage ($0.015/GB-month) and Class A ($4.50/million) / Class B ($0.36/million) operations." },
          { title: "D1 Transactions", content: "D1 supports transactions via the batch() API for atomic operations. Full ACID transaction support is on the roadmap." },
          { title: "Pages Build Performance", content: "Pages build times can be improved by using build caching, optimizing dependencies, and using incremental builds where possible." },
          { title: "Workers AI Models", content: "Workers AI supports various models including Llama, Stable Diffusion, Whisper, and embedding models. New models are added regularly." },
          { title: "Durable Objects", content: "Durable Objects provide strongly consistent, low-latency coordination for WebSocket connections, real-time collaboration, and stateful logic at the edge." },
          { title: "Workers KV", content: "Workers KV is an eventually consistent key-value store with global distribution. For stronger consistency, consider using Durable Objects." },
        ];
        
        const queryLower = query.toLowerCase();
        const relevant = mockDocs.filter(d => 
          d.title.toLowerCase().includes(queryLower) || 
          d.content.toLowerCase().includes(queryLower)
        );
        return JSON.stringify(relevant.length > 0 ? relevant : mockDocs.slice(0, 2), null, 2);
      } catch {
        return JSON.stringify([{ title: "Documentation", content: "Search functionality temporarily unavailable." }]);
      }
    }
    
    case "investigate": {
      const question = (args.question as string || '').toLowerCase();
      
      const relatedFeedback = feedback.filter(f => 
        f.content.toLowerCase().includes(question) ||
        f.product.toLowerCase().includes(question)
      ).slice(0, 5);
      
      const sentimentBreakdown = {
        positive: relatedFeedback.filter(f => f.sentiment === "positive").length,
        negative: relatedFeedback.filter(f => f.sentiment === "negative").length,
        neutral: relatedFeedback.filter(f => f.sentiment === "neutral").length
      };
      
      const urgencyBreakdown = {
        P0: relatedFeedback.filter(f => f.urgency === "P0").length,
        P1: relatedFeedback.filter(f => f.urgency === "P1").length,
        P2: relatedFeedback.filter(f => f.urgency === "P2").length,
        P3: relatedFeedback.filter(f => f.urgency === "P3").length
      };
      
      return JSON.stringify({
        topic: question,
        feedbackCount: relatedFeedback.length,
        sentimentBreakdown,
        urgencyBreakdown,
        sampleFeedback: relatedFeedback.slice(0, 3).map(f => f.content),
        recommendation: sentimentBreakdown.negative > sentimentBreakdown.positive 
          ? "This topic has more negative sentiment - consider prioritizing investigation."
          : "Sentiment is balanced or positive - monitor but not urgent."
      }, null, 2);
    }
    
    case "updateStatus": {
      const id = args.id as string;
      const status = args.status as string;
      return JSON.stringify({ 
        success: true, 
        message: `Updated ${id} to ${status}`,
        note: "Status update is simulated in this prototype."
      });
    }
    
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}
