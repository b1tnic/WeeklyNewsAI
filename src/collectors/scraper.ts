import axios from 'axios';
import * as cheerio from 'cheerio';
import type { NewsArticle } from '../types.js';

interface ScrapeConfig {
  url: string;
  selectors: {
    article: string;
    title: string;
    link: string;
    description?: string;
    date?: string;
    image?: string;
  };
  baseUrl?: string;
}

const SCRAPE_CONFIGS: Record<string, ScrapeConfig> = {
  'TechCrunch AI': {
    url: 'https://techcrunch.com/category/artificial-intelligence/',
    selectors: {
      article: 'article.post-block',
      title: 'h2.post-block__title a',
      link: 'h2.post-block__title a',
      description: '.post-block__content',
      date: 'time',
      image: 'img.post-block__media',
    },
    baseUrl: 'https://techcrunch.com',
  },
  'The Verge AI': {
    url: 'https://www.theverge.com/ai-artificial-intelligence',
    selectors: {
      article: 'div[data-testid="duet--content-cards--content-card"]',
      title: 'a h2',
      link: 'a',
      description: 'p',
      image: 'img',
    },
    baseUrl: 'https://www.theverge.com',
  },
};

async function scrapeSource(
  sourceName: string,
  config: ScrapeConfig
): Promise<NewsArticle[]> {
  try {
    const response = await axios.get(config.url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const articles: NewsArticle[] = [];

    $(config.selectors.article)
      .slice(0, 10)
      .each((_, element) => {
        const $el = $(element);
        const title = $el.find(config.selectors.title).text().trim();
        let link = $el.find(config.selectors.link).attr('href') || '';

        if (link && !link.startsWith('http') && config.baseUrl) {
          link = config.baseUrl + link;
        }

        const description = config.selectors.description
          ? $el.find(config.selectors.description).text().trim()
          : '';

        const dateStr = config.selectors.date
          ? $el.find(config.selectors.date).attr('datetime')
          : null;

        const imageUrl = config.selectors.image
          ? $el.find(config.selectors.image).attr('src')
          : undefined;

        if (title && link) {
          articles.push({
            title,
            description: description.slice(0, 200),
            url: link,
            source: sourceName,
            publishedAt: dateStr ? new Date(dateStr) : new Date(),
            imageUrl,
          });
        }
      });

    return articles;
  } catch (error) {
    console.error(`Error scraping ${sourceName}:`, error);
    return [];
  }
}

export async function scrapeAllSources(): Promise<NewsArticle[]> {
  const results: NewsArticle[] = [];

  for (const [sourceName, config] of Object.entries(SCRAPE_CONFIGS)) {
    console.log(`Scraping ${sourceName}...`);
    const articles = await scrapeSource(sourceName, config);
    results.push(...articles);
  }

  return results;
}
