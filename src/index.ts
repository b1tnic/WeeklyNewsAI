import 'dotenv/config';
import { collectAllNews } from './collectors/index.js';
import { fetchAllArticleContents, summarizeArticles } from './processors/index.js';
import { createOrUpdatePresentation } from './slides/index.js';

async function main() {
  console.log('=== Weekly AI News Collector ===\n');

  // Validate environment variables
  const newsApiKey = process.env.NEWSAPI_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!newsApiKey) {
    throw new Error('NEWSAPI_KEY environment variable is required');
  }

  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  if (!serviceAccountEmail || !privateKey) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY are required'
    );
  }

  try {
    // Step 1: Collect news from all sources
    console.log('Step 1: Collecting news...\n');
    const articles = await collectAllNews(newsApiKey);

    if (articles.length === 0) {
      console.log('No articles found. Exiting.');
      return;
    }

    console.log(`\nCollected ${articles.length} articles total.\n`);

    // Step 2: Fetch full article content
    console.log('Step 2: Fetching article contents...\n');
    const articlesWithContent = await fetchAllArticleContents(articles);

    // Step 3: Summarize articles with Gemini AI
    console.log('\nStep 3: Summarizing articles with Gemini AI...\n');
    const summarizedArticles = await summarizeArticles(
      articlesWithContent,
      geminiApiKey
    );

    // Step 4: Create/Update Google Slides presentation
    console.log('\nStep 4: Creating Google Slides presentation...\n');
    const presentationUrl = await createOrUpdatePresentation(summarizedArticles, {
      serviceAccountEmail,
      privateKey,
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
      presentationId: process.env.GOOGLE_SLIDES_PRESENTATION_ID,
    });

    console.log('\n=== Complete! ===');
    console.log(`Presentation URL: ${presentationUrl}`);
  } catch (error) {
    console.error('Error during execution:', error);
    process.exit(1);
  }
}

main();
