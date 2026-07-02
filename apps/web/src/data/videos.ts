export interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  author: string;
  duration: string;
  views: string;
  tag: string;
  tagColor: string;
  description: string;
  chapters?: { time: string; label: string }[];
}

export const PLAYLIST: VideoItem[] = [
  {
    id: 'bedrock-intro',
    youtubeId: 'BY4YlxhSKr8',
    title: "A Beginner's Guide to Amazon Bedrock",
    author: 'AWS Official',
    duration: '22:14',
    views: '84k',
    tag: 'Bedrock',
    tagColor: '#7367F0',
    description:
      "A comprehensive beginner's guide to Amazon Bedrock — covers Knowledge Bases, Guardrails, and Security best practices for enterprise deployments.",
    chapters: [
      { time: '0:00',  label: 'Introduction to Amazon Bedrock' },
      { time: '3:45',  label: 'Foundation Models Overview' },
      { time: '7:20',  label: 'Amazon Bedrock Knowledge Bases' },
      { time: '12:10', label: 'Guardrails for Amazon Bedrock' },
      { time: '17:30', label: 'Security & IAM Best Practices' },
      { time: '20:45', label: 'Next Steps & Resources' },
    ],
  },
  {
    id: 'rag-bedrock',
    youtubeId: 'N0tlOXZwrSs',
    title: 'Building RAG Applications with Amazon Bedrock',
    author: 'AWS Developers',
    duration: '18:32',
    views: '52k',
    tag: 'RAG',
    tagColor: '#00BAD1',
    description:
      'Learn how to build RAG pipelines using Amazon Bedrock Knowledge Bases, OpenSearch Serverless, and Claude foundation models.',
    chapters: [
      { time: '0:00',  label: 'What is RAG?' },
      { time: '4:10',  label: 'Knowledge Bases Setup' },
      { time: '9:00',  label: 'Vector Embeddings & Search' },
      { time: '13:45', label: 'Query & Response Flow' },
      { time: '16:30', label: 'Production Best Practices' },
    ],
  },
  {
    id: 'bedrock-agents',
    youtubeId: 'iMxfwZWl3EY',
    title: 'Amazon Bedrock Agents — Build AI Agents',
    author: 'AWS Official',
    duration: '15:48',
    views: '39k',
    tag: 'Agents',
    tagColor: '#FF9F43',
    description:
      'Deep dive into Amazon Bedrock Agents — how to create, configure, and deploy autonomous AI agents that execute multi-step tasks.',
    chapters: [
      { time: '0:00',  label: 'Agents Architecture Overview' },
      { time: '3:20',  label: 'Creating Your First Agent' },
      { time: '8:15',  label: 'Action Groups & Lambda' },
      { time: '12:00', label: 'Testing & Monitoring' },
    ],
  },
  {
    id: 'prompt-engineering',
    youtubeId: 'dOxUroR57xs',
    title: 'Prompt Engineering for AWS GenAI',
    author: 'AWS re:Invent',
    duration: '28:05',
    views: '121k',
    tag: 'Prompting',
    tagColor: '#28C76F',
    description:
      'Master prompt engineering techniques for Claude and other foundation models on Amazon Bedrock. Covers chain-of-thought, few-shot, and advanced patterns.',
    chapters: [
      { time: '0:00',  label: 'Prompt Engineering Basics' },
      { time: '5:30',  label: 'Chain-of-Thought Prompting' },
      { time: '12:00', label: 'Few-Shot & Zero-Shot' },
      { time: '18:40', label: 'Advanced Techniques' },
      { time: '24:10', label: 'Real-world Examples' },
    ],
  },
  {
    id: 'guardrails-security',
    youtubeId: 'fqpSMDX2Xho',
    title: 'Guardrails & Security in Amazon Bedrock',
    author: 'AWS Security',
    duration: '20:17',
    views: '28k',
    tag: 'Security',
    tagColor: '#FF4C51',
    description:
      'Learn how to implement Guardrails in Amazon Bedrock to prevent harmful content, filter PII, and enforce content policies.',
    chapters: [
      { time: '0:00',  label: 'Why Guardrails Matter' },
      { time: '4:30',  label: 'Content Filtering' },
      { time: '9:15',  label: 'PII Detection & Redaction' },
      { time: '14:00', label: 'Topic Denial Policies' },
      { time: '17:45', label: 'Monitoring & Audit Logs' },
    ],
  },
];
