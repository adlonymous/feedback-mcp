import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function splitFeedbackForAutoRAG() {
  const feedbackData = fs.readFileSync(path.join(__dirname, '../data/feedback.json'), 'utf-8');
  const feedbackItems = JSON.parse(feedbackData);

  console.log(`Splitting ${feedbackItems.length} feedback items for AutoRAG indexing...`);

  const outputPath = path.join(__dirname, '../data/feedback');
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  for (const item of feedbackItems) {
    const filename = `${item.id}.json`;
    const filepath = path.join(outputPath, filename);
    const fileContent = {
      id: item.id,
      content: item.content,
      source: item.source,
      product: item.product,
      sentiment: item.sentiment,
      urgency: item.urgency,
      status: item.status,
      timestamp: item.timestamp,
    };

    fs.writeFileSync(filepath, JSON.stringify(fileContent, null, 2), 'utf-8');
    console.log(`Created: ${filename}`);
  }

  console.log(`\n✓ Split complete! ${feedbackItems.length} individual files ready in data/feedback/`);
  console.log(`\nNext steps:`);
  console.log(`1. Upload data/feedback/ directory to R2 bucket:`);
  console.log(`   npx wrangler r2 object put feedback-mcp-data/feedback/ --file=data/feedback/ --recursive`);
  console.log(`2. Go to https://dash.cloudflare.com/?to=/:account/ai/ai-search`);
  console.log(`3. Create new AI Search, select "R2 bucket" as data source`);
  console.log(`4. Select "feedback-mcp-data" bucket and complete setup`);
}

splitFeedbackForAutoRAG().catch(console.error);
