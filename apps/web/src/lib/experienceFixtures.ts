export type Article = {
  slug: string;
  tag: string;
  title: string;
  description: string;
  author: string;
  date: string;
  readTime?: string;
  content: ArticleSection[];
  relatedQuizId?: string;
};

export type ArticleSection = {
  type: 'intro' | 'heading' | 'paragraph' | 'list' | 'code' | 'callout';
  text?: string;
  items?: string[];
  language?: string;
};

export const FEATURED_ARTICLES: Article[] = [
  {
    slug: 'hugging-face-cheat-sheet',
    tag: 'Hugging Face',
    title: 'Hugging Face Cheat Sheet',
    description: 'A practical guide to transformers, tokenizers, pipelines, and the core building blocks needed to ship quickly.',
    author: 'Katalyst Team',
    date: 'January 20, 2026',
    readTime: '6 min read',
    relatedQuizId: 'aws-quick-start',
    content: [
      { type: 'intro', text: 'Hugging Face is the de-facto hub for open-source ML models. This cheat sheet covers the essential APIs you need to load models, run inference, and fine-tune on custom data — all without getting lost in the documentation.' },
      { type: 'heading', text: 'Core Concepts' },
      { type: 'paragraph', text: 'The Transformers library is built around three primitives: models, tokenizers, and pipelines. A tokenizer converts raw text into token IDs. A model processes those IDs through transformer layers. A pipeline wires both together for one-line inference.' },
      { type: 'list', items: [
        'AutoTokenizer — load any tokenizer by model name',
        'AutoModel / AutoModelForXxx — load pre-trained weights',
        'pipeline() — end-to-end inference in one call',
        'Trainer API — fine-tune with a config object',
        'datasets library — stream large corpora without OOM',
      ]},
      { type: 'heading', text: 'Quick Inference Example' },
      { type: 'code', language: 'python', text: `from transformers import pipeline

# Sentiment analysis
classifier = pipeline("sentiment-analysis")
result = classifier("AWS certification prep is actually fun.")
# [{'label': 'POSITIVE', 'score': 0.9998}]

# Text generation
generator = pipeline("text-generation", model="gpt2")
output = generator("The key to passing the CLF-C02 is", max_new_tokens=50)` },
      { type: 'heading', text: 'Tokenizer Essentials' },
      { type: 'paragraph', text: 'Always use the tokenizer that matches your model checkpoint. Mismatched tokenizers cause silent errors that are hard to debug.' },
      { type: 'code', language: 'python', text: `from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("bert-base-uncased")
inputs = tok("Hello world", return_tensors="pt", padding=True, truncation=True)
# inputs.input_ids, inputs.attention_mask` },
      { type: 'callout', text: 'Pro tip: set TOKENIZERS_PARALLELISM=false in production to avoid fork warnings when running multiple worker processes.' },
      { type: 'heading', text: 'Fine-Tuning Checklist' },
      { type: 'list', items: [
        'Freeze base layers, train only the classification head first',
        'Use a learning rate of 2e-5 to 5e-5 for BERT-class models',
        'Gradient accumulation over 4–8 steps if batch size is small',
        'Monitor eval_loss, not just accuracy — early stopping on eval_loss',
        'Save with trainer.save_model() and push to Hub for versioning',
      ]},
    ],
  },
  {
    slug: 'sql-with-ai-cheat-sheet',
    tag: 'SQL',
    title: 'SQL with AI Cheat Sheet',
    description: 'Speed up analysis work with prompt patterns, safer query drafting, and debugging loops that reduce syntax churn.',
    author: 'Katalyst Team',
    date: 'January 12, 2026',
    readTime: '5 min read',
    content: [
      { type: 'intro', text: 'SQL and LLMs are a natural pair — LLMs can draft, explain, and optimize queries; SQL can ground AI outputs in real structured data. This cheat sheet shows the prompt patterns that work best and the guardrails that prevent dangerous outputs.' },
      { type: 'heading', text: 'The Text-to-SQL Prompt Pattern' },
      { type: 'paragraph', text: 'The most reliable way to get accurate SQL from an LLM is to provide the schema, sample rows, and a concrete question. Ambiguity in the question = ambiguity in the query.' },
      { type: 'code', language: 'text', text: `You are a SQL expert. Given the following schema and question, write a safe, read-only SQL query.

Schema:
CREATE TABLE orders (id INT, customer_id INT, amount DECIMAL, created_at TIMESTAMP);
CREATE TABLE customers (id INT, name VARCHAR(100), region VARCHAR(50));

Question: Which region had the highest total order amount last month?

Rules:
- Use only SELECT statements
- Never use DROP, DELETE, UPDATE, INSERT
- Add LIMIT 1000 to all queries` },
      { type: 'heading', text: 'Debugging Loop' },
      { type: 'list', items: [
        'Paste the error message directly into the prompt — LLMs are good at SQL error interpretation',
        'Ask for an EXPLAIN ANALYZE breakdown when a query is slow',
        'Request a step-by-step CTE rewrite for complex nested queries',
        'Always run AI-generated queries on a read replica, never production primary',
      ]},
      { type: 'callout', text: 'Never let an AI-generated query touch production data without human review. Always test on a staging environment or read replica first.' },
      { type: 'heading', text: 'Useful Prompt Templates' },
      { type: 'list', items: [
        '"Explain what this query does, then suggest 2 optimizations"',
        '"Rewrite this query to avoid the N+1 pattern"',
        '"Convert this SQL to a pandas DataFrame operation"',
        '"Add proper indexing recommendations for this query pattern"',
        '"Find potential SQL injection vulnerabilities in this input handling"',
      ]},
    ],
  },
  {
    slug: 'ai-agents-cheat-sheet',
    tag: 'AI Agents',
    title: 'AI Agents Cheat Sheet',
    description: 'Core agent patterns, tool use, orchestration basics, and the guardrails required for production-grade flows.',
    author: 'Katalyst Team',
    date: 'January 7, 2026',
    readTime: '7 min read',
    content: [
      { type: 'intro', text: 'AI agents combine reasoning, memory, and tool use to complete multi-step tasks autonomously. Understanding the core patterns helps you build reliable agents instead of fragile prompt chains.' },
      { type: 'heading', text: 'Agent Anatomy' },
      { type: 'list', items: [
        'LLM — the reasoning core (Claude, GPT-4, etc.)',
        'Tools — functions the LLM can call (search, code exec, DB queries)',
        'Memory — short-term (context window) + long-term (vector store)',
        'Orchestrator — the loop that routes between LLM calls and tool calls',
        'Guardrails — output validators, content filters, loop-break conditions',
      ]},
      { type: 'heading', text: 'The ReAct Pattern' },
      { type: 'paragraph', text: 'ReAct (Reasoning + Acting) is the most widely used agent pattern. The agent alternates between Thought (planning), Action (tool call), and Observation (tool result) until it has enough information to answer.' },
      { type: 'code', language: 'text', text: `Thought: I need to find the current AWS Lambda pricing for us-east-1.
Action: web_search("AWS Lambda pricing us-east-1 2025")
Observation: $0.20 per 1M requests, $0.0000166667 per GB-second

Thought: I now have the data. I can calculate the monthly cost.
Action: calculate(requests=10000000, duration_ms=200, memory_mb=512)
Observation: Monthly cost ≈ $2.00 requests + $16.67 compute = $18.67

Final Answer: Estimated monthly cost is $18.67.` },
      { type: 'heading', text: 'Production Guardrails' },
      { type: 'list', items: [
        'Set a max_iterations limit — infinite loops are a real failure mode',
        'Validate tool inputs before execution — agents hallucinate arguments',
        'Log every tool call with its arguments for auditing',
        'Use content filters on final outputs before returning to users',
        'Implement circuit breakers for expensive external API calls',
      ]},
      { type: 'callout', text: 'The most common agent failure is "tool hallucination" — the agent invents a tool call result rather than waiting for the real one. Always verify tool outputs before feeding them back to the model.' },
    ],
  },
  {
    slug: 'bedrock-guardrails-guide',
    tag: 'Bedrock',
    title: 'Amazon Bedrock Guardrails Guide',
    description: 'Content filtering, policy design, and secure rollout patterns for foundation-model apps.',
    author: 'Katalyst Team',
    date: 'December 28, 2025',
    readTime: '8 min read',
    relatedQuizId: 'clf-c02-technology',
    content: [
      { type: 'intro', text: 'Amazon Bedrock Guardrails lets you apply safety policies to any foundation model on Bedrock — including Claude, Titan, and Llama models — without changing your application code. This guide covers the key configuration options and real-world rollout patterns.' },
      { type: 'heading', text: 'What Guardrails Cover' },
      { type: 'list', items: [
        'Content filtering — hate speech, violence, sexual content, insults, misconduct',
        'Denied topics — custom topics your app should never discuss',
        'Word filters — blocklist of specific phrases or terms',
        'PII redaction — detect and mask personal data in inputs and outputs',
        'Grounding checks — validate that responses are grounded in retrieved context (RAG)',
      ]},
      { type: 'heading', text: 'Creating a Guardrail (CLI)' },
      { type: 'code', language: 'bash', text: `aws bedrock create-guardrail \\
  --name "production-guardrail" \\
  --content-policy-config '{
    "filtersConfig": [
      {"type": "HATE", "inputStrength": "HIGH", "outputStrength": "HIGH"},
      {"type": "VIOLENCE", "inputStrength": "MEDIUM", "outputStrength": "HIGH"}
    ]
  }' \\
  --sensitive-information-policy-config '{
    "piiEntitiesConfig": [
      {"type": "EMAIL", "action": "ANONYMIZE"},
      {"type": "US_SSN", "action": "BLOCK"}
    ]
  }'` },
      { type: 'heading', text: 'Rollout Strategy' },
      { type: 'list', items: [
        'Start with MEDIUM strength on all filters, monitor for false positives',
        'Use shadow mode first — log blocks without actually blocking',
        'Review blocked inputs weekly and tune thresholds accordingly',
        'Apply different guardrails to different user segments (public vs authenticated)',
        'Always log guardrail violations to CloudWatch for compliance auditing',
      ]},
      { type: 'callout', text: 'Bedrock Guardrails apply to both the input prompt and the model output. Configure both sides — a clean prompt can still produce unsafe output.' },
    ],
  },
  {
    slug: 'prompt-evaluation-framework',
    tag: 'Prompting',
    title: 'Prompt Evaluation Framework',
    description: 'A repeatable scoring system for prompt quality, answer grounding, latency, and failure handling.',
    author: 'Katalyst Team',
    date: 'December 18, 2025',
    readTime: '6 min read',
    content: [
      { type: 'intro', text: 'Building reliable AI features requires treating prompts like software. That means versioning, testing, and measuring them. This framework gives you a repeatable evaluation process that catches regressions before they reach users.' },
      { type: 'heading', text: 'The Four Evaluation Dimensions' },
      { type: 'list', items: [
        'Correctness — does the output answer the question accurately?',
        'Groundedness — is every claim traceable to the provided context?',
        'Formatting — does the output match the expected structure?',
        'Safety — does the output avoid harmful, biased, or off-topic content?',
      ]},
      { type: 'heading', text: 'Building a Test Dataset' },
      { type: 'paragraph', text: 'Start with 50–100 golden examples: question + expected answer pairs that represent the full range of inputs your prompt will receive. Include edge cases: empty inputs, adversarial prompts, very long contexts, and multilingual queries.' },
      { type: 'heading', text: 'Scoring Rubric Example' },
      { type: 'code', language: 'text', text: `For each test case, score on a 1–5 scale:

Correctness:
  5 — Fully correct, no errors
  3 — Partially correct, minor inaccuracies
  1 — Incorrect or misleading

Groundedness:
  5 — Every claim supported by context
  3 — Mostly grounded, 1-2 unsupported claims
  1 — Hallucinated content

Target thresholds:
  Correctness ≥ 4.0 average
  Groundedness ≥ 4.5 average
  P95 latency < 3 seconds` },
      { type: 'callout', text: 'Run your eval suite on every prompt change, not just on a schedule. Prompt regressions are as real as code regressions — treat them the same way.' },
    ],
  },
  {
    slug: 'llm-observability-checklist',
    tag: 'Observability',
    title: 'LLM Observability Checklist',
    description: 'Events, traces, safety telemetry, and review loops every AI product team should instrument from day one.',
    author: 'Katalyst Team',
    date: 'December 11, 2025',
    readTime: '5 min read',
    content: [
      { type: 'intro', text: 'LLMs are non-deterministic and expensive. Without proper observability you are flying blind — you will not know when outputs degrade, costs spike, or safety issues emerge. Instrument from day one, not as an afterthought.' },
      { type: 'heading', text: 'Essential Events to Log' },
      { type: 'list', items: [
        'Every prompt sent: timestamp, model, token count, user ID (hashed)',
        'Every completion received: latency, finish_reason, output tokens, cost',
        'Guardrail interventions: what was blocked and why',
        'User feedback signals: thumbs up/down, flag, copy, re-generate',
        'Error events: timeouts, rate limits, content filter triggers',
      ]},
      { type: 'heading', text: 'Key Metrics Dashboard' },
      { type: 'list', items: [
        'Request rate and error rate (RED method)',
        'P50/P95/P99 latency per model and endpoint',
        'Daily active users sending prompts vs total users',
        'Cost per user per day (tokens × price per token)',
        'Guardrail block rate (spike = attack or prompt drift)',
      ]},
      { type: 'heading', text: 'CloudWatch Setup (Bedrock)' },
      { type: 'code', language: 'bash', text: `# Enable model invocation logging
aws bedrock put-model-invocation-logging-configuration \\
  --logging-config '{
    "cloudWatchConfig": {
      "logGroupName": "/aws/bedrock/model-invocations",
      "roleArn": "arn:aws:iam::ACCOUNT_ID:role/BedrockLoggingRole"
    },
    "textDataDeliveryEnabled": false,
    "imageDataDeliveryEnabled": false
  }'` },
      { type: 'callout', text: 'Do NOT log raw prompt text to CloudWatch by default — it may contain PII. Use textDataDeliveryEnabled: false and only log metadata (token counts, latency, model ID) unless you have explicit consent and data handling policies.' },
    ],
  },
];

export const PLATFORM_TESTIMONIALS = [
  {
    company: 'Learner',
    quote: 'Structured practice and faster review loops helped me stay consistent without the product feeling heavy.',
  },
  {
    company: 'Learner',
    quote: 'The streak and certification workflow gave me a cleaner path from theory into applied skill-building.',
  },
  {
    company: 'Learner',
    quote: 'The upgrade flow is calmer, clearer, and much more premium than anything else I have tried.',
  },
  {
    company: 'Learner',
    quote: 'Course discovery, editorial content, and guided practice now feel like one system instead of separate surfaces.',
  },
];
