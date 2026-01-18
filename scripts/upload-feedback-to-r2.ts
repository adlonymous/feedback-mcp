import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const feedbackDir = path.join(__dirname, '../data/feedback');
const files = fs.readdirSync(feedbackDir).filter(f => f.endsWith('.json'));

console.log(`Uploading ${files.length} feedback files to R2...`);

for (const file of files) {
  const key = `feedback/${file}`;
  const filePath = path.join(feedbackDir, file);
  console.log(`Uploading ${file}...`);

  try {
    execSync(`npx wrangler r2 object put feedback-mcp-data/${key} --file=${filePath} --remote`, {
      stdio: 'inherit',
    });
    console.log(`✓ ${file}`);
  } catch (error) {
    console.error(`✗ ${file} failed:`, error);
  }
}

console.log('\n✓ Upload complete!');
console.log('\nNext: Create AI Search instance via dashboard:');
console.log('https://dash.cloudflare.com/?to=/:account/ai/ai-search');
console.log('\n1. Click "Create"');
console.log('2. Select "R2 bucket" as data source');
console.log('3. Choose "feedback-mcp-data" bucket');
console.log('4. Wait for indexing to complete');
