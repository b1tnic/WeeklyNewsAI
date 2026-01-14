import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NewsArticle } from '../types.js';

const SUMMARY_PROMPT = `以下のニュース記事を日本語で簡潔に要約してください。
要約は3〜4文程度で、以下の点を含めてください：
- 記事の主要なポイント
- なぜこれが重要なのか
- AI/テクノロジー業界への影響（該当する場合）

記事タイトル: {title}
記事内容:
{content}

要約:`;

export async function summarizeArticles(
  articles: NewsArticle[],
  apiKey: string
): Promise<NewsArticle[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  console.log(`Summarizing ${articles.length} articles with Gemini...`);

  const results: NewsArticle[] = [];

  for (const article of articles) {
    try {
      // Skip if no content
      if (!article.content || article.content.length < 100) {
        console.log(`Skipping "${article.title.slice(0, 30)}..." (no content)`);
        results.push({
          ...article,
          summary: article.description || 'コンテンツを取得できませんでした。',
        });
        continue;
      }

      const prompt = SUMMARY_PROMPT
        .replace('{title}', article.title)
        .replace('{content}', article.content.slice(0, 6000));

      const result = await model.generateContent(prompt);
      const response = result.response;
      const summary = response.text().trim();

      console.log(`Summarized: "${article.title.slice(0, 40)}..."`);

      results.push({
        ...article,
        summary,
      });

      // Rate limiting - small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to summarize "${article.title}":`, error);
      results.push({
        ...article,
        summary: article.description || '要約を生成できませんでした。',
      });
    }
  }

  console.log(`Completed summarization for ${results.length} articles`);
  return results;
}
