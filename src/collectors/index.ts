import type { NewsArticle } from '../types.js';
import { fetchFromNewsAPI } from './newsapi.js';
import { scrapeAllSources } from './scraper.js';

export async function collectAllNews(
  newsApiKey: string
): Promise<NewsArticle[]> {
  console.log('Starting news collection...');

  const [newsApiArticles, scrapedArticles] = await Promise.all([
    fetchFromNewsAPI(newsApiKey),
    scrapeAllSources(),
  ]);

  console.log(`NewsAPI: ${newsApiArticles.length} articles`);
  console.log(`Scraped: ${scrapedArticles.length} articles`);

  const allArticles = [...newsApiArticles, ...scrapedArticles];

  // Remove duplicates by URL
  const uniqueArticles = Array.from(
    new Map(allArticles.map((a) => [a.url, a])).values()
  );

  // Sort by date (newest first)
  uniqueArticles.sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  );

  console.log(`Total unique articles: ${uniqueArticles.length}`);

  return uniqueArticles;
}

export { fetchFromNewsAPI } from './newsapi.js';
export { scrapeAllSources } from './scraper.js';
