import type { APIRoute } from 'astro';

interface SummarizeArgs {
  query: string;
  source?: 'support' | 'discord' | 'twitter';
  status?: 'new' | 'in_progress' | 'resolved';
  urgency?: 'P0' | 'P1' | 'P2' | 'P3';
  product?: string;
  maxItems?: number;
}

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

function textSearch(items: Feedback[], query: string): Feedback[] {
  const lowerQuery = query.toLowerCase();
  const terms = lowerQuery.split(/\s+/).filter(t => t.length > 2);
  
  return items
    .map(item => {
      const content = item.content.toLowerCase();
      const matches = terms.filter(term => content.includes(term)).length;
      return { item, score: matches / terms.length };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

function filterFeedback(
  items: Feedback[],
  filters: { source?: string; status?: string; urgency?: string; product?: string }
): Feedback[] {
  return items.filter(item => {
    if (filters.source && item.source !== filters.source) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.urgency && item.urgency !== filters.urgency) return false;
    if (filters.product && item.product !== filters.product) return false;
    return true;
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const args = await request.json() as SummarizeArgs;
    const { query, source, status, urgency, product, maxItems = 15 } = args;

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const env = locals.runtime.env as { FEEDBACK_BUCKET: R2Bucket; AI: Ai };
    const obj = await env.FEEDBACK_BUCKET.get('feedback.json');
    if (!obj) {
      return new Response(JSON.stringify({ error: 'Feedback data not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const allFeedback = JSON.parse(await obj.text()) as Feedback[];
    let filtered = filterFeedback(allFeedback, { source, status, urgency, product });
    let results = textSearch(filtered, query);
    results = results.slice(0, maxItems);

    if (results.length === 0) {
      return new Response(JSON.stringify({
        summary: 'No feedback items found matching the query and filters.',
        sourceCount: 0,
        sources: [],
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const feedbackContext = results
      .map(r => `[${r.id}] (${r.source}, ${r.product}, ${r.urgency}, ${r.status}): "${r.content}"`)
      .join('\n');

    const systemPrompt = `You are a product manager analyzing customer feedback. Summarize the key themes, issues, and requests from the feedback below. Be concise and actionable. Group by theme if appropriate. Highlight any P0/P1 urgent items.`;

    const userPrompt = `Query: "${query}"
Filters: source=${source || 'any'}, status=${status || 'any'}, urgency=${urgency || 'any'}, product=${product || 'any'}

Feedback items (${results.length} total):
${feedbackContext}

Provide a summary of the key themes and actionable insights from this feedback.`;

    const response = await env.AI.run(
      '@cf/meta/llama-3.1-8b-instruct' as Parameters<Ai['run']>[0],
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1024,
      }
    );

    const summary = typeof response === 'object' && response !== null && 'response' in response
      ? (response as { response: string }).response
      : String(response);

    return new Response(JSON.stringify({
      summary,
      sourceCount: results.length,
      filters: { source, status, urgency, product },
      sources: results.map(r => ({
        id: r.id,
        content: r.content,
        source: r.source,
        product: r.product,
        urgency: r.urgency,
        status: r.status,
      })),
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Summarize error:', error);
    return new Response(JSON.stringify({ 
      error: 'Summarize failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
