import type { NewsSource } from '../types.js';

export const AI_KEYWORDS = [
  'artificial intelligence',
  'AI',
  'machine learning',
  'deep learning',
  'ChatGPT',
  'OpenAI',
  'Claude',
  'Anthropic',
  'Google AI',
  'Gemini',
  'LLM',
  'GPT',
  'neural network',
  'generative AI',
];

export const NEWS_SOURCES: NewsSource[] = [
  {
    name: 'NewsAPI',
    type: 'api',
  },
  {
    name: 'TechCrunch AI',
    type: 'scrape',
    url: 'https://techcrunch.com/category/artificial-intelligence/',
  },
  {
    name: 'The Verge AI',
    type: 'scrape',
    url: 'https://www.theverge.com/ai-artificial-intelligence',
  },
];

export const NEWSAPI_DOMAINS = [
  'techcrunch.com',
  'theverge.com',
  'wired.com',
  'arstechnica.com',
  'venturebeat.com',
  'thenextweb.com',
].join(',');
