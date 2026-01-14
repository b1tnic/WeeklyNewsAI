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

async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .ad, .advertisement, .social-share').remove();

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
    console.error(`Failed to fetch content from ${url}:`, error);
    return '';
  }
}

export async function fetchAllArticleContents(
  articles: NewsArticle[]
): Promise<NewsArticle[]> {
  console.log(`Fetching content for ${articles.length} articles...`);

  const results = await Promise.all(
    articles.map(async (article) => {
      const content = await fetchArticleContent(article.url);
      return {
        ...article,
        content,
      };
    })
  );

  const successCount = results.filter((a) => a.content && a.content.length > 100).length;
  console.log(`Successfully fetched content for ${successCount}/${articles.length} articles`);

  return results;
}
