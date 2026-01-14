export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: Date;
  imageUrl?: string;
}

export interface NewsSource {
  name: string;
  type: 'api' | 'rss' | 'scrape';
  url?: string;
}

export interface SlideContent {
  title: string;
  articles: NewsArticle[];
  dateRange: {
    start: Date;
    end: Date;
  };
}
