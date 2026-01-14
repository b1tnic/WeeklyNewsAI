import type { slides_v1 } from 'googleapis';
import { format, subDays } from 'date-fns';
import type { NewsArticle } from '../types.js';
import { getAuthClient, getSlidesClient, getDriveClient } from './auth.js';
import {
  createTitleSlideRequests,
  createTocSlideRequests,
  createDetailSlideRequests,
} from './templates.js';

const ARTICLES_PER_TOC_SLIDE = 8;

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

  // 1. Title slide
  requests.push(...createTitleSlideRequests('title_slide', dateRange));

  // 2. Table of contents slides
  const totalTocSlides = Math.ceil(articles.length / ARTICLES_PER_TOC_SLIDE);
  for (let i = 0; i < totalTocSlides; i++) {
    const tocArticles = articles.slice(
      i * ARTICLES_PER_TOC_SLIDE,
      (i + 1) * ARTICLES_PER_TOC_SLIDE
    );
    requests.push(
      ...createTocSlideRequests(`toc_slide_${i}`, tocArticles, i + 1)
    );
  }

  // 3. Detail slides for each article (with AI summary)
  articles.forEach((article, index) => {
    requests.push(
      ...createDetailSlideRequests(`detail_slide_${index}`, article, index + 1)
    );
  });

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
