import type { APIRoute } from 'astro';

interface SearchArgs {
  query: string;
  source?: 'support' | 'discord' | 'twitter';
  status?: 'new' | 'in_progress' | 'resolved';
  urgency?: 'P0' | 'P1' | 'P2' | 'P3';
  product?: string;
  limit?: number;
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
    const args = await request.json() as SearchArgs;
    const { query, source, status, urgency, product, limit = 10 } = args;

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const env = locals.runtime.env as { FEEDBACK_BUCKET: R2Bucket };
    const obj = await env.FEEDBACK_BUCKET.get('feedback.json');
    if (!obj) {
      return new Response(JSON.stringify({ error: 'Feedback data not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const allFeedback = JSON.parse(await obj.text()) as Feedback[];
    let results = textSearch(allFeedback, query);
    results = filterFeedback(results, { source, status, urgency, product });
    results = results.slice(0, limit);

    return new Response(JSON.stringify({
      searchMethod: 'text',
      totalResults: results.length,
      filters: { source, status, urgency, product },
      results,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ 
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
