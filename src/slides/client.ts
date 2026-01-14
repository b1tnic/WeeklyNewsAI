import type { slides_v1 } from 'googleapis';
import { format, subDays } from 'date-fns';
import type { NewsArticle } from '../types.js';
import { getAuthClient, getSlidesClient, getDriveClient } from './auth.js';
import {
  createTitleSlideRequests,
  createNewsSlideRequests,
} from './templates.js';

const ARTICLES_PER_SLIDE = 5;

interface SlidesConfig {
  serviceAccountEmail: string;
  privateKey: string;
  folderId?: string;
  presentationId?: string;
}

export async function createOrUpdatePresentation(
  articles: NewsArticle[],
  config: SlidesConfig
): Promise<string> {
  const auth = getAuthClient(config.serviceAccountEmail, config.privateKey);
  const slidesClient = getSlidesClient(auth);
  const driveClient = getDriveClient(auth);

  const dateRange = {
    start: subDays(new Date(), 7),
    end: new Date(),
  };

  let presentationId: string;

  if (config.presentationId) {
    // Update existing presentation
    presentationId = config.presentationId;
    await clearPresentation(slidesClient, presentationId);
  } else {
    // Create new presentation
    const title = `週次AIニュース ${format(dateRange.end, 'yyyy-MM-dd')}`;
    const presentation = await slidesClient.presentations.create({
      requestBody: { title },
    });
    presentationId = presentation.data.presentationId!;

    // Move to folder if specified
    if (config.folderId) {
      await driveClient.files.update({
        fileId: presentationId,
        addParents: config.folderId,
        fields: 'id, parents',
      });
    }
  }

  // Build all slide requests
  const requests: slides_v1.Schema$Request[] = [];

  // Title slide
  requests.push(...createTitleSlideRequests('title_slide', dateRange));

  // News slides (paginated)
  const totalSlides = Math.ceil(articles.length / ARTICLES_PER_SLIDE);
  for (let i = 0; i < totalSlides; i++) {
    const slideArticles = articles.slice(
      i * ARTICLES_PER_SLIDE,
      (i + 1) * ARTICLES_PER_SLIDE
    );
    requests.push(
      ...createNewsSlideRequests(`news_slide_${i}`, slideArticles, i + 1)
    );
  }

  // Apply all requests
  await slidesClient.presentations.batchUpdate({
    presentationId,
    requestBody: { requests },
  });

  const url = `https://docs.google.com/presentation/d/${presentationId}`;
  console.log(`Presentation created/updated: ${url}`);

  return url;
}

async function clearPresentation(
  slidesClient: slides_v1.Slides,
  presentationId: string
): Promise<void> {
  const presentation = await slidesClient.presentations.get({
    presentationId,
  });

  const slideIds =
    presentation.data.slides
      ?.map((slide) => slide.objectId)
      .filter((id): id is string => !!id) || [];

  // Keep at least one slide (required by API), delete rest
  if (slideIds.length > 1) {
    const requests = slideIds.slice(1).map((objectId) => ({
      deleteObject: { objectId },
    }));

    await slidesClient.presentations.batchUpdate({
      presentationId,
      requestBody: { requests },
    });
  }
}
