import axios from 'axios';
import { subDays, format } from 'date-fns';
import type { NewsArticle } from '../types.js';
import { AI_KEYWORDS, NEWSAPI_DOMAINS } from '../config/sources.js';

interface NewsAPIArticle {
  title: string;
  description: string | null;
  url: string;
  source: { name: string };
  publishedAt: string;
  urlToImage: string | null;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

export async function fetchFromNewsAPI(apiKey: string): Promise<NewsArticle[]> {
  const fromDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const query = AI_KEYWORDS.slice(0, 5).join(' OR ');

  try {
    const response = await axios.get<NewsAPIResponse>(
      'https://newsapi.org/v2/everything',
      {
        params: {
          q: query,
          from: fromDate,
          sortBy: 'publishedAt',
          language: 'en',
          domains: NEWSAPI_DOMAINS,
          pageSize: 30,
        },
        headers: {
          'X-Api-Key': apiKey,
        },
      }
    );

    if (response.data.status !== 'ok') {
      console.error('NewsAPI returned non-ok status');
      return [];
    }

    return response.data.articles.map((article) => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      source: article.source.name,
      publishedAt: new Date(article.publishedAt),
      imageUrl: article.urlToImage || undefined,
    }));
  } catch (error) {
    console.error('Error fetching from NewsAPI:', error);
    return [];
  }
}
