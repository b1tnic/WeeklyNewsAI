import axios from 'axios';
import * as cheerio from 'cheerio';
import type { NewsArticle } from '../types.js';

const CONTENT_SELECTORS = [
  'article',
  '[class*="article-body"]',
  '[class*="post-content"]',
  '[class*="entry-content"]',
  '[class*="story-body"]',
  'main',
  '.content',
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchArticleContent(
  url: string,
  retries = 2
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);

      // Remove unwanted elements
      $('script, style, nav, header, footer, aside, .ad, .advertisement, .social-share, .related-posts, .comments').remove();

      // Try different selectors to find main content
      let content = '';
      for (const selector of CONTENT_SELECTORS) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.first().text().trim();
          if (content.length > 200) {
            break;
          }
        }
      }

      // Fallback to body if no content found
      if (!content || content.length < 200) {
        content = $('body').text().trim();
      }

      // Clean up whitespace
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      // Limit content length
      return content.slice(0, 8000);
    } catch (error) {
      const isRateLimit = axios.isAxiosError(error) && error.response?.status === 429;

      if (isRateLimit && attempt < retries) {
        const waitTime = (attempt + 1) * 3000; // 3s, 6s
        console.log(`Rate limited on ${url}, waiting ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }

      if (attempt === retries) {
        console.error(`Failed to fetch content from ${url} after ${retries + 1} attempts`);
      }
      return '';
    }
  }
  return '';
}

export async function fetchAllArticleContents(
  articles: NewsArticle[]
): Promise<NewsArticle[]> {
  console.log(`Fetching content for ${articles.length} articles...`);

  const results: NewsArticle[] = [];

  // Sequential fetching with delay to avoid rate limits
  for (const article of articles) {
    const content = await fetchArticleContent(article.url);
    results.push({
      ...article,
      content,
    });

    // Add delay between requests to be respectful to servers
    await delay(1500);
  }

  const successCount = results.filter((a) => a.content && a.content.length > 100).length;
  console.log(`Successfully fetched content for ${successCount}/${articles.length} articles`);

  return results;
}
