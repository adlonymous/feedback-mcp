const feedbackTemplates = [
  { product: "workers", templates: [
    {
      base: "Workers cold starts are killing our API latency.",
      details: [
        "We're seeing 200-400ms cold starts on our authentication endpoints. This is P0 for us because users are timing out during login flows. We've tried Smart Placement but it only helps for some regions.",
        "Our payment processing worker takes 350ms to cold start, which causes Stripe webhooks to timeout. We've had to implement retry logic on the client side as a workaround. Would really appreciate some guidance on reducing this.",
        "Running a real-time bidding system and cold starts are causing us to lose auctions. Every millisecond counts in our industry. Have you considered offering reserved capacity or pre-warming options?",
      ],
      sentiment: "negative",
      urgencyBias: "P0"
    },
    {
      base: "Love how fast Workers are once they're warm.",
      details: [
        "We migrated from AWS Lambda and the performance difference is night and day. Our p99 latency dropped from 180ms to 12ms. The global distribution means our users in Asia finally have a good experience.",
        "Just shipped our new API on Workers and the team is blown away. Sub-10ms response times globally without any caching. Our backend engineers keep asking if the metrics are broken because they've never seen latency this low.",
        "Been using Workers for 2 years now and it's been rock solid. We serve 50M requests/day and have had zero downtime. The DX with wrangler is also excellent - deploy in seconds.",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "Can we get better debugging tools for Workers?",
      details: [
        "The current tail logs are hard to follow when debugging production issues. We need better filtering, search, and the ability to correlate logs across requests. Something like Datadog's log explorer would be amazing.",
        "Spent 4 hours debugging an issue yesterday that would have taken 10 minutes with proper stack traces. The minified errors in production are nearly impossible to decode. Source map support would be huge.",
        "Our team struggles with debugging Durable Objects state. We need a way to inspect DO state in production without writing custom endpoints. A dashboard view of active DOs and their state would help tremendously.",
      ],
      sentiment: "negative",
      urgencyBias: "P1"
    },
    {
      base: "Smart Placement is a game changer for our global app.",
      details: [
        "We have a database in us-east-1 and Smart Placement automatically routes our Workers there. Saw a 60% reduction in database query latency. This feature alone justified our migration from Vercel Edge Functions.",
        "Our app serves users globally but our Supabase instance is in Frankfurt. Smart Placement figured this out automatically and now our European users get 15ms API responses instead of 150ms. Incredible.",
        "Finally a CDN provider that understands backend workloads need to be close to data, not users. Smart Placement + Hyperdrive has made our Postgres queries 3x faster. No code changes needed.",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "Need better support for WebSocket connections in Workers.",
      details: [
        "Trying to build a real-time collaboration feature but WebSocket handling in Workers is clunky. The hibernation API for Durable Objects helps but we need better patterns for broadcasting to multiple clients.",
        "WebSocket connections randomly drop after ~10 minutes of inactivity even with keepalive pings. We've tried everything suggested in the docs. This is blocking our launch of a live chat feature.",
        "Would love native WebSocket broadcasting support instead of having to loop through connections manually. Also, better metrics on active connections per DO would help with capacity planning.",
      ],
      sentiment: "negative",
      urgencyBias: "P1"
    },
    {
      base: "The 50ms CPU limit is too restrictive for our use case.",
      details: [
        "We're doing ML inference with ONNX models and consistently hitting the CPU limit. Had to split our pipeline into multiple worker invocations which adds latency and complexity. Please consider higher limits for paid plans.",
        "Image processing takes 45-80ms depending on the input size. We keep hitting the limit on larger images. The unbound option helps but it's expensive for our volume. Need a middle tier.",
        "Running complex data transformations that occasionally spike to 60-70ms. The random failures when hitting limits are worse than predictable throttling. Can we get soft limits with warnings instead of hard failures?",
      ],
      sentiment: "negative",
      urgencyBias: "P1"
    },
    {
      base: "Workers KV is great but eventual consistency is a problem.",
      details: [
        "We use KV for feature flags and the 60-second propagation delay causes issues. When we disable a feature due to a bug, some users still see it for a minute. For critical flags, we've had to move to Durable Objects.",
        "Love KV's simplicity and global distribution, but we've been bitten by stale reads multiple times. Our session data sometimes shows the old state after updates. Would pay more for a strongly consistent tier.",
        "The read-after-write consistency within the same location is fine, but cross-region consistency is unpredictable. Sometimes it's seconds, sometimes minutes. Better visibility into replication status would help.",
      ],
      sentiment: "neutral",
      urgencyBias: "P2"
    },
    {
      base: "Durable Objects are perfect for our real-time collaboration feature.",
      details: [
        "Built a Google Docs-like editor using DOs and it's been flawless. The single-threaded model makes conflict resolution trivial. We have 10K concurrent editing sessions and haven't had a single data corruption issue.",
        "Migrated our game server from a custom WebSocket solution to Durable Objects. Code is 70% smaller and we no longer worry about scaling. The hibernation feature cut our costs by 80%.",
        "Using DOs for distributed rate limiting across our API. The strong consistency guarantees mean we never over-serve requests. Setup took 2 hours vs 2 weeks for our Redis-based solution.",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "Would love to see better TypeScript support in Workers runtime.",
      details: [
        "Some newer TS features don't work as expected in the Workers runtime. We've had to pin to older TS versions to avoid compilation issues. Better alignment with the latest TypeScript releases would be appreciated.",
        "The types for the Workers runtime are sometimes outdated or incomplete. Spent hours debugging an issue that turned out to be incorrect type definitions for the Cache API. More rigorous type testing would help.",
        "Would love first-class support for decorators and the latest ECMAScript features. Our codebase uses modern patterns and we have to transpile more than we'd like.",
      ],
      sentiment: "neutral",
      urgencyBias: "P2"
    },
    {
      base: "Cron triggers work well but documentation could be clearer.",
      details: [
        "Took us a while to figure out the exact timing guarantees for cron triggers. The docs say 'approximately' but don't quantify the variance. We've seen triggers fire 30+ seconds late which matters for our billing jobs.",
        "Would love better examples of error handling in cron triggers. What happens if a trigger fails? Is it retried? The docs don't cover failure scenarios well.",
        "The cron syntax reference is good but real-world examples are lacking. Had to experiment a lot to get timezone handling right for our daily digest emails.",
      ],
      sentiment: "neutral",
      urgencyBias: "P2"
    }
  ]},
  { product: "r2", templates: [
    {
      base: "R2 egress pricing is way better than S3.",
      details: [
        "We moved 50TB of assets from S3 and our monthly bill dropped from $4,500 to $230. The zero egress fees are a game changer for our CDN use case. Migration was seamless with the S3-compatible API.",
        "Running a video hosting platform and R2 egress savings are massive. We serve 2PB/month and would be paying AWS $180K in egress fees alone. R2 makes our business model viable.",
        "Finally a storage provider that doesn't punish you for actually using your data. We switched our backup storage to R2 and can now afford to do daily restores for testing. Was cost-prohibitive on S3.",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "R2 multipart upload documentation is confusing.",
      details: [
        "Spent 3 days trying to get multipart uploads working correctly. The docs mention the S3 API but don't cover R2-specific quirks. Eventually found answers on Discord but this should be in official docs.",
        "The part size requirements and limits aren't clearly documented. We kept getting cryptic errors until we figured out the minimum part size. A troubleshooting guide would save developers hours.",
        "Examples in the docs use the S3 SDK but some operations behave differently on R2. Would appreciate R2-specific code samples, especially for resumable uploads.",
      ],
      sentiment: "negative",
      urgencyBias: "P2"
    },
    {
      base: "Need presigned URL support for R2.",
      details: [
        "This is blocking our migration from S3. We use presigned URLs extensively for direct browser uploads and secure downloads. Having to proxy everything through Workers adds latency and cost.",
        "Our mobile app relies on presigned URLs for offline-first image sync. Without this feature, we can't move to R2. Please prioritize this - it's been requested for over a year.",
        "Implemented a workaround using Workers to generate signed URLs, but it's not the same as native presigned URLs. The extra Worker invocation adds 20ms to every file access.",
      ],
      sentiment: "negative",
      urgencyBias: "P0"
    },
    {
      base: "R2 performance is solid for our CDN use case.",
      details: [
        "Serving 100M images/day through R2 with p99 latency under 50ms globally. The integration with Workers for image transformations is seamless. Better than our previous CloudFront + S3 setup.",
        "We use R2 for static asset hosting and the TTFB is consistently excellent. Combined with Cache Reserve, we're seeing sub-20ms responses for cached content worldwide.",
        "Benchmarked R2 against S3, GCS, and Azure Blob for our use case. R2 was fastest for reads from edge locations, which matters most for us. Write performance is comparable.",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "Would be great to have R2 event notifications.",
      details: [
        "We need to trigger Workers when objects are uploaded to R2. Currently polling or using external webhooks as a workaround. Native event notifications like S3 would simplify our architecture significantly.",
        "Building a media processing pipeline and need to react to uploads in real-time. The lack of event notifications means we have to build a queue-based system ourselves. Please add this feature.",
        "Event notifications would enable so many use cases - thumbnail generation, virus scanning, metadata extraction. We'd move more workloads to R2 if this existed.",
      ],
      sentiment: "neutral",
      urgencyBias: "P1"
    },
    {
      base: "R2 lifecycle policies would help us manage storage costs.",
      details: [
        "We have 200TB of logs that should be auto-deleted after 90 days. Without lifecycle policies, we're manually running cleanup scripts. This is error-prone and we've accidentally deleted wrong data twice.",
        "Need tiered storage for archival data. Some objects are accessed frequently for 30 days then rarely. Would love automatic transition to a cheaper storage class like S3 Glacier.",
        "Lifecycle policies are table stakes for enterprise storage. We can't fully migrate from S3 until R2 has feature parity here. Our compliance team requires automatic deletion of PII after retention periods.",
      ],
      sentiment: "neutral",
      urgencyBias: "P1"
    },
    {
      base: "The R2 dashboard needs better bucket management features.",
      details: [
        "Can't easily browse large buckets in the dashboard - it times out after a few thousand objects. Need pagination, search, and filtering. I shouldn't have to use wrangler CLI for basic exploration.",
        "Would love to see storage analytics in the dashboard - breakdown by prefix, growth over time, access patterns. Currently flying blind on optimization opportunities.",
        "The bucket settings page is minimal. Need easier configuration of CORS, lifecycle rules (when available), and access policies. Having to use the API for everything slows us down.",
      ],
      sentiment: "negative",
      urgencyBias: "P2"
    },
    {
      base: "S3 compatibility is almost there.",
      details: [
        "95% of our S3 code worked out of the box with R2. The remaining 5% was minor tweaks. Really impressed with the compatibility effort. Just need a few more API methods for full parity.",
        "Tried to use aws-sdk v3 with R2 and hit some edge cases with multipart operations. Would help if docs listed known compatibility gaps. Spent time debugging things that turned out to be unsupported.",
        "Our Terraform S3 provider mostly works with R2 but some data sources fail. Better documentation of what's supported would help with IaC adoption.",
      ],
      sentiment: "neutral",
      urgencyBias: "P2"
    },
    {
      base: "R2 + Workers integration is seamless.",
      details: [
        "The bindings system makes R2 access from Workers trivially easy. No credentials management, no SDK setup, just works. Built our entire asset pipeline in an afternoon.",
        "Love that R2 operations from Workers don't count against rate limits the same way. We process millions of objects daily and never worry about throttling. The architecture just makes sense.",
        "Using Workers to transform R2 objects on-the-fly is powerful. We resize images, transcode audio, and generate thumbnails without any external services. The tight integration is a competitive advantage.",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "Need better monitoring and analytics for R2.",
      details: [
        "The current metrics in the dashboard are too basic. We need request breakdowns by status code, latency percentiles, and bandwidth by prefix. Can't effectively troubleshoot without this data.",
        "Would love R2 access logs similar to S3 server access logging. We need this for security audits and compliance. Currently have no visibility into who's accessing what.",
        "Alerting on R2 metrics would be valuable - notify us when error rates spike or storage grows unexpectedly. Having to poll the API and build our own alerting is tedious.",
      ],
      sentiment: "negative",
      urgencyBias: "P2"
    }
  ]},
  { product: "pages", templates: [
    {
      base: "Pages build times have gotten worse lately.",
      details: [
        "Our Next.js builds used to complete in 45 seconds, now they're taking 3+ minutes. Nothing changed in our code. Started happening about 2 weeks ago. Is there a known issue or degradation?",
        "Incremental builds seem broken - full rebuilds happening even for small changes. Our monorepo builds are now 8 minutes. This is killing our PR preview workflow.",
        "Build queue times are also bad during peak hours. Sometimes waiting 5 minutes just to start the build. Makes iteration painfully slow for our team.",
      ],
      sentiment: "negative",
      urgencyBias: "P1"
    },
    {
      base: "Pages preview deployments are amazing for our PR workflow.",
      details: [
        "Every PR gets its own preview URL automatically. Our designers can review changes without any setup. This has transformed our review process and caught so many issues before merge.",
        "Love the GitHub integration - preview links posted as comments, deployment status checks, the whole experience is polished. This is how CI/CD should work.",
        "We have 50 engineers making PRs daily and preview deployments scale perfectly. Each preview is isolated and fast. Saved us from building our own preview infrastructure.",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "Need better support for monorepos in Pages.",
      details: [
        "Our Turborepo setup doesn't work well with Pages. It rebuilds everything instead of just the changed packages. Spent days trying to configure root directory and build commands correctly.",
        "Would love native pnpm workspace support. Currently have to use workarounds for dependency hoisting. Other platforms like Vercel handle this much better.",
        "The build cache doesn't understand monorepo structure. Shared packages get rebuilt constantly even when unchanged. Need smarter cache invalidation based on dependency graph.",
      ],
      sentiment: "negative",
      urgencyBias: "P1"
    },
    {
      base: "The Pages functions integration with Workers is confusing.",
      details: [
        "The relationship between Pages Functions and Workers is unclear. Are they the same? Different? When should I use each? The docs use the terms interchangeably which adds to the confusion.",
        "Migrating our API routes from Pages Functions to standalone Workers was harder than expected. The execution model and bindings work slightly differently. Need a clear migration guide.",
        "Wanted to share code between Pages Functions and Workers but the module resolution is different. Ended up duplicating code. Better documentation on project structure would help.",
      ],
      sentiment: "negative",
      urgencyBias: "P2"
    },
    {
      base: "Would love native support for more frameworks in Pages.",
      details: [
        "Our Remix app requires custom build configuration that's fragile. Would love first-class Remix support like Next.js gets. The adapter situation is confusing.",
        "Tried deploying a SolidStart app and had to fight with the build setup. Other platforms have one-click deploys for modern frameworks. Pages feels behind here.",
        "Even frameworks that are 'supported' often need tweaks. Our Astro SSR deployment required hours of debugging. The preset system needs more testing.",
      ],
      sentiment: "neutral",
      urgencyBias: "P2"
    },
    {
      base: "Pages custom domains setup is smooth.",
      details: [
        "Added our custom domain in 2 minutes, SSL certificate provisioned automatically. No DNS propagation delays since we're already on Cloudflare DNS. Best domain setup experience I've had.",
        "Love that Pages handles SSL renewal automatically. One less thing to worry about. The integration with Cloudflare's other features (WAF, analytics) through the same domain is seamless.",
        "Setup wildcard subdomains for our multi-tenant app easily. Each customer gets their own subdomain routed to the same Pages project. Configuration was straightforward.",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "Build caching in Pages needs improvement.",
      details: [
        "The cache invalidation is too aggressive. Changing a README rebuilds everything. Need smarter dependency tracking so only affected files trigger rebuilds.",
        "node_modules caching is inconsistent. Sometimes it's cached, sometimes not, with no clear pattern. Our builds vary from 1 to 4 minutes depending on cache luck.",
        "Would love the option to use a custom cache key. Our build outputs are deterministic based on content hash but Pages doesn't let us leverage this.",
      ],
      sentiment: "negative",
      urgencyBias: "P2"
    },
    {
      base: "The Pages dashboard could use a redesign.",
      details: [
        "It's cluttered and hard to find things. The deployment list buries important info. I want to see build status, time, and commit message at a glance without clicking into each deployment.",
        "No way to compare deployments or rollback easily from the UI. Have to use wrangler or the API. Basic rollback functionality should be one click.",
        "The analytics section is buried and minimal. Would love to see traffic, errors, and performance metrics prominently displayed. Currently have to use separate tools.",
      ],
      sentiment: "negative",
      urgencyBias: "P2"
    },
    {
      base: "Love the git integration but GitHub App permissions are confusing.",
      details: [
        "The GitHub App asks for a lot of permissions and it's not clear why each is needed. Our security team pushed back during setup. A breakdown of why each permission is required would help.",
        "Had issues with the GitHub integration losing access to repos after org changes. Took a while to figure out we needed to re-authorize. Better error messages would help.",
        "Would like more granular control over which repos the GitHub App can access. Currently it's all-or-nothing for the org. This is a blocker for some enterprises.",
      ],
      sentiment: "neutral",
      urgencyBias: "P2"
    },
    {
      base: "Pages analytics are useful but need more detail.",
      details: [
        "The basic traffic metrics are helpful but I need more. Want to see performance metrics (LCP, FID, CLS), error rates, and geographic breakdown. Currently using a third-party tool for this.",
        "Would love to see analytics per-page, not just site-wide. Need to know which pages are slow or getting errors. The current aggregate view isn't actionable.",
        "Real-time analytics would be great for launches. Currently there's a significant delay. Want to watch traffic as it happens, not 30 minutes later.",
      ],
      sentiment: "neutral",
      urgencyBias: "P2"
    }
  ]},
  { product: "d1", templates: [
    {
      base: "D1 transaction support would be huge for our use case.",
      details: [
        "We need atomic operations across multiple tables for our e-commerce checkout. Without transactions, we've had orphaned orders and inventory mismatches. Currently using complex workarounds with batch operations.",
        "Building a banking app and transactions are non-negotiable. We love D1's edge performance but can't use it for anything involving money movement until proper ACID transactions are available.",
        "Even basic BEGIN/COMMIT/ROLLBACK would unblock us. We don't need advanced isolation levels, just the ability to atomically update multiple rows. This is the #1 blocker for D1 adoption.",
      ],
      sentiment: "negative",
      urgencyBias: "P0"
    },
    {
      base: "D1 is perfect for our edge app, very fast.",
      details: [
        "Queries return in 2-5ms at the edge. Our previous setup with a centralized Postgres added 150ms minimum. Users notice the difference - our NPS scores improved after the migration.",
        "Running a read-heavy app with 10K QPS and D1 handles it beautifully. The automatic replication means users always hit a nearby replica. Zero ops burden compared to managing our own database.",
        "Love that D1 is SQLite-based. We can develop locally with the same database, run unit tests without mocks, and even ship the database schema with our app for offline support.",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "Need better migration tooling for D1.",
      details: [
        "The current migration workflow is manual and error-prone. We need something like Prisma Migrate or golang-migrate. Tracking which migrations have run on which environment is a pain.",
        "Rolled back a bad migration and it was stressful. No built-in rollback support, had to manually write reversal SQL. Need a safer migration system with automatic rollback capabilities.",
        "Would love schema diffing - point at my TypeScript types and generate the migration SQL. Currently hand-writing migrations and hoping they match my Drizzle schema.",
      ],
      sentiment: "negative",
      urgencyBias: "P1"
    },
    {
      base: "D1 query performance varies a lot.",
      details: [
        "Same query sometimes takes 2ms, sometimes 200ms. No clear pattern. Makes performance budgeting difficult. We've had to add generous timeouts and retry logic throughout our app.",
        "Suspect some queries hit cold replicas with stale indexes. After running ANALYZE, performance improves temporarily then degrades again. Need better visibility into query planning.",
        "Complex JOINs are unpredictable. Simple queries are fast but anything with 3+ table joins can spike to 500ms. Not sure if this is expected or if we're doing something wrong.",
      ],
      sentiment: "negative",
      urgencyBias: "P1"
    },
    {
      base: "Would love D1 branching like PlanetScale.",
      details: [
        "Database branching for preview deployments would be incredible. Right now we use a shared dev database which causes conflicts. Each PR having its own D1 branch would transform our workflow.",
        "PlanetScale's branching and deploy requests are amazing for safe schema changes. D1 needs something similar. We're hesitant to change schemas without a safety net.",
        "Branching would also help with data isolation in development. Multiple developers stepping on each other's test data is frustrating. Individual branches would solve this.",
      ],
      sentiment: "neutral",
      urgencyBias: "P2"
    },
    {
      base: "D1 size limits are restrictive for our app.",
      details: [
        "Hit the 2GB limit faster than expected. Our app stores user-generated content and we're already having to shard. Need higher limits or better guidance on when D1 isn't the right choice.",
        "The row size limits are also tight. Had to restructure our schema to avoid storing JSON blobs inline. SQLite supports larger rows, why doesn't D1?",
        "We understand edge databases have constraints, but the limits should be clearly documented upfront. We architected around D1 and now face a costly migration.",
      ],
      sentiment: "negative",
      urgencyBias: "P1"
    },
    {
      base: "The D1 studio in the dashboard is helpful.",
      details: [
        "Being able to run queries directly in the dashboard is great for quick debugging. Love the schema browser and query history. Saves time vs always using wrangler.",
        "The query explain feature helped us identify a missing index that was killing performance. Would love even more optimization suggestions and index recommendations.",
        "Use D1 Studio daily for data exploration. It's not as full-featured as TablePlus but having it built-in with no setup is valuable. Keep improving it!",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "Need better D1 backup and restore options.",
      details: [
        "We need point-in-time recovery for compliance. The current export functionality is manual and doesn't capture a consistent snapshot. This is a hard requirement for our enterprise customers.",
        "Accidentally dropped a table in production and recovery was painful. Need automated backups with easy restore. Even daily snapshots would be better than nothing.",
        "Would like to restore to a specific timestamp, not just the latest backup. A bug corrupted data for 2 hours before we noticed. Had to manually fix thousands of rows.",
      ],
      sentiment: "negative",
      urgencyBias: "P1"
    },
    {
      base: "D1 + Drizzle ORM works great together.",
      details: [
        "Drizzle's D1 driver is excellent. Type-safe queries, automatic migrations, and the performance overhead is negligible. This combo is our default for new projects.",
        "The schema-first approach with Drizzle means our TypeScript types and database schema are always in sync. No more runtime type errors from database changes.",
        "Love that Drizzle generates efficient SQL. We compared it to raw queries and the generated SQL is actually well-optimized. The abstraction isn't costing us performance.",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "Wish D1 had better support for full-text search.",
      details: [
        "SQLite has FTS5 built-in but D1 doesn't expose it. We need basic search functionality without spinning up a separate search service. Would love native FTS support.",
        "Currently using LIKE queries for search which is slow and doesn't handle relevance ranking. Even basic trigram search would be better than what we have.",
        "Had to integrate Algolia for search which adds cost and complexity. Native D1 search, even if basic, would simplify our architecture significantly.",
      ],
      sentiment: "neutral",
      urgencyBias: "P2"
    }
  ]},
  { product: "ai", templates: [
    {
      base: "Workers AI inference is slow compared to alternatives.",
      details: [
        "Llama 2 inference takes 8-15 seconds for a simple completion. Replicate does the same in 2-3 seconds. We want to use Workers AI for the integration benefits but the latency is a dealbreaker.",
        "Tested Workers AI against OpenAI and Anthropic APIs. For similar model sizes, Workers AI is 3-4x slower. Understand there are tradeoffs but need better performance for production use.",
        "The cold start for AI models is brutal - sometimes 20+ seconds for the first request. Need warm model instances or better caching. Our users won't wait that long.",
      ],
      sentiment: "negative",
      urgencyBias: "P1"
    },
    {
      base: "Love that Workers AI is integrated with the rest of Cloudflare.",
      details: [
        "The AI binding makes it trivial to add intelligence to our Workers. No API keys, no SDK setup, just call env.AI.run(). Built a content moderation system in an hour.",
        "Running inference at the edge means we can process user data without sending it to external services. This is huge for privacy and compliance. Our legal team is happy.",
        "The unified billing is nice - one invoice for compute, storage, and AI. Makes budgeting simpler than managing separate accounts with OpenAI, AWS, and others.",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "Need more model options in Workers AI.",
      details: [
        "The current model selection is limited compared to Replicate or HuggingFace. We need specialized models for our domain (medical text analysis) that aren't available. Any plans to expand the catalog?",
        "Would love to see more embedding models. The current options work but we need models trained on code for our semantic search use case. CodeBERT or similar would be valuable.",
        "Missing good image generation models. The current Stable Diffusion version is dated. Would switch from Replicate if Workers AI had SDXL or similar quality models.",
      ],
      sentiment: "neutral",
      urgencyBias: "P2"
    },
    {
      base: "AI Gateway logging is helpful for debugging.",
      details: [
        "Being able to see every AI request and response has been invaluable for debugging prompt issues. Found several edge cases where our prompts were ambiguous. The log search is also fast.",
        "Love the cost tracking per request in AI Gateway. Helped us identify that 10% of requests were using 50% of our AI budget. Optimized those prompts and saved significantly.",
        "The ability to replay requests from the log is underrated. We use it to build regression tests for our prompts. Changed how we iterate on AI features.",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "Would love fine-tuning support in Workers AI.",
      details: [
        "We have domain-specific data that would dramatically improve model quality for our use case. Can't fine-tune on Workers AI so we're stuck with generic models or external services.",
        "Even LoRA/adapter support would be valuable. We don't need to fine-tune the base model, just add a small specialized layer. This is common on other platforms.",
        "Our competitors are fine-tuning models for their products. We're at a disadvantage using only base models. Please prioritize fine-tuning support for enterprise customers.",
      ],
      sentiment: "neutral",
      urgencyBias: "P1"
    },
    {
      base: "The AI binding is super easy to use.",
      details: [
        "Went from zero to working AI feature in 30 minutes. The TypeScript types are great, the API is intuitive, and the docs have clear examples. Best AI integration DX I've experienced.",
        "Love that I don't have to manage API keys or worry about key rotation. The binding just works. Security team approved it faster than they would have for external API integrations.",
        "The unified interface across different model types (text, image, embedding) is well-designed. Same pattern for everything. Our codebase stays clean and consistent.",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "Vectorize + Workers AI is a powerful combination.",
      details: [
        "Built a RAG system entirely on Cloudflare - embeddings with Workers AI, storage in Vectorize, and generation with Llama. No external dependencies. The latency is great and costs are predictable.",
        "The integration between Vectorize and Workers AI is seamless. Our semantic search returns results in 50ms including embedding generation. Users love the instant answers.",
        "Using this stack for customer support automation. Feed tickets into Vectorize, match similar past issues, generate responses. Reduced ticket resolution time by 40%.",
      ],
      sentiment: "positive",
      urgencyBias: "P3"
    },
    {
      base: "Need better rate limiting controls for AI endpoints.",
      details: [
        "Our AI features get abused by bots and we can't rate limit effectively. Need per-user, per-IP, and per-API-key limits specifically for AI endpoints. The cost of abuse is high.",
        "Would like to set spending caps per user. One customer accidentally ran a loop that burned through our monthly AI budget in an hour. Need automatic cutoffs.",
        "The current rate limiting is too coarse. We need different limits for different models based on their cost. Can't treat a cheap embedding the same as an expensive completion.",
      ],
      sentiment: "negative",
      urgencyBias: "P1"
    },
    {
      base: "Workers AI pricing is competitive but needs a free tier.",
      details: [
        "The pay-per-use pricing is fair, but there's no way to experiment without incurring costs. Even a small free tier (1K requests/month) would let developers prototype before committing.",
        "Comparing to OpenAI's free tier and Replicate's free credits, Workers AI has a higher barrier to entry. Many developers try other services first because they're free to start.",
        "We'd recommend Workers AI to more people if they could try it risk-free. The pricing is good once you're committed, but getting to that first 'aha' moment has friction.",
      ],
      sentiment: "neutral",
      urgencyBias: "P2"
    },
    {
      base: "Would love streaming support for AI responses.",
      details: [
        "Our chatbot needs to stream responses as they're generated. Users hate waiting 10 seconds for a complete response. Streaming is table stakes for AI chat experiences.",
        "Other platforms stream tokens as they're generated. Workers AI returns the complete response only. This makes our UX feel sluggish even when total latency is similar.",
        "Tried to work around with chunked responses but it's hacky. Native streaming support with proper SSE or WebSocket delivery would be much cleaner.",
      ],
      sentiment: "negative",
      urgencyBias: "P0"
    }
  ]}
];

const sources: Array<"support" | "discord" | "twitter"> = ["support", "discord", "twitter"];
const statuses: Array<"new" | "in_progress" | "resolved"> = ["new", "in_progress", "resolved"];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface FeedbackTemplate {
  base: string;
  details: string[];
  sentiment: string;
  urgencyBias: string;
}

function deriveUrgencyFromBias(urgencyBias: string): "P0" | "P1" | "P2" | "P3" {
  const urgencyMap: Record<string, readonly ["P0" | "P1" | "P2" | "P3", "P0" | "P1" | "P2" | "P3", "P0" | "P1" | "P2" | "P3"]> = {
    "P0": ["P0", "P0", "P1"],
    "P1": ["P1", "P1", "P2"],
    "P2": ["P2", "P2", "P3"],
    "P3": ["P2", "P3", "P3"],
  };
  return randomChoice([...urgencyMap[urgencyBias] || urgencyMap["P3"]]);
}

function deriveStatus(): "new" | "in_progress" | "resolved" {
  const statusRoll = Math.random();
  if (statusRoll < 0.4) return "new";
  if (statusRoll < 0.75) return "in_progress";
  return "resolved";
}

function generateTimestamp(): string {
  const baseDate = new Date("2025-01-15");
  const daysAgo = randomInt(0, 30);
  const hoursAgo = randomInt(0, 23);
  return new Date(baseDate.getTime() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000).toISOString();
}

function generateFeedback(id: number) {
  const productData = randomChoice(feedbackTemplates);
  const template: FeedbackTemplate = randomChoice(productData.templates);
  const detail = randomChoice(template.details);

  return {
    id: `fb_${String(id).padStart(3, "0")}`,
    content: `${template.base} ${detail}`,
    source: randomChoice(sources),
    product: productData.product,
    sentiment: template.sentiment as "positive" | "negative" | "neutral",
    urgency: deriveUrgencyFromBias(template.urgencyBias),
    status: deriveStatus(),
    timestamp: generateTimestamp(),
  };
}

const feedback = Array.from({ length: 250 }, (_, i) => generateFeedback(i + 1));

console.log(JSON.stringify(feedback, null, 2));
