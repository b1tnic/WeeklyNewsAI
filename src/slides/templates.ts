import type { slides_v1 } from 'googleapis';
import type { NewsArticle } from '../types.js';
import { format } from 'date-fns';

type Request = slides_v1.Schema$Request;

const COLORS = {
  primary: { red: 0.2, green: 0.4, blue: 0.8 },
  secondary: { red: 0.3, green: 0.3, blue: 0.3 },
  white: { red: 1, green: 1, blue: 1 },
  lightGray: { red: 0.95, green: 0.95, blue: 0.95 },
};

export function createTitleSlideRequests(
  slideId: string,
  dateRange: { start: Date; end: Date }
): Request[] {
  const dateStr = `${format(dateRange.start, 'yyyy/MM/dd')} - ${format(dateRange.end, 'yyyy/MM/dd')}`;

  return [
    {
      createSlide: {
        objectId: slideId,
        slideLayoutReference: { predefinedLayout: 'BLANK' },
      },
    },
    {
      createShape: {
        objectId: `${slideId}_title`,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 600, unit: 'PT' },
            height: { magnitude: 80, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 60,
            translateY: 150,
            unit: 'PT',
          },
        },
      },
    },
    {
      insertText: {
        objectId: `${slideId}_title`,
        text: '週次 AI ニュースまとめ',
      },
    },
    {
      updateTextStyle: {
        objectId: `${slideId}_title`,
        style: {
          fontSize: { magnitude: 44, unit: 'PT' },
          fontFamily: 'Arial',
          bold: true,
          foregroundColor: { opaqueColor: { rgbColor: COLORS.primary } },
        },
        fields: 'fontSize,fontFamily,bold,foregroundColor',
      },
    },
    {
      createShape: {
        objectId: `${slideId}_date`,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 400, unit: 'PT' },
            height: { magnitude: 40, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 60,
            translateY: 240,
            unit: 'PT',
          },
        },
      },
    },
    {
      insertText: {
        objectId: `${slideId}_date`,
        text: dateStr,
      },
    },
    {
      updateTextStyle: {
        objectId: `${slideId}_date`,
        style: {
          fontSize: { magnitude: 24, unit: 'PT' },
          fontFamily: 'Arial',
          foregroundColor: { opaqueColor: { rgbColor: COLORS.secondary } },
        },
        fields: 'fontSize,fontFamily,foregroundColor',
      },
    },
  ];
}

// Table of contents slide - list of all articles
export function createTocSlideRequests(
  slideId: string,
  articles: NewsArticle[],
  pageNumber: number
): Request[] {
  const requests: Request[] = [
    {
      createSlide: {
        objectId: slideId,
        slideLayoutReference: { predefinedLayout: 'BLANK' },
      },
    },
    {
      createShape: {
        objectId: `${slideId}_header`,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 650, unit: 'PT' },
            height: { magnitude: 50, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 30,
            translateY: 20,
            unit: 'PT',
          },
        },
      },
    },
    {
      insertText: {
        objectId: `${slideId}_header`,
        text: `今週のAIニュース一覧 (${pageNumber})`,
      },
    },
    {
      updateTextStyle: {
        objectId: `${slideId}_header`,
        style: {
          fontSize: { magnitude: 24, unit: 'PT' },
          fontFamily: 'Arial',
          bold: true,
          foregroundColor: { opaqueColor: { rgbColor: COLORS.primary } },
        },
        fields: 'fontSize,fontFamily,bold,foregroundColor',
      },
    },
  ];

  articles.forEach((article, index) => {
    const yOffset = 70 + index * 45;
    const itemId = `${slideId}_item_${index}`;

    requests.push(
      {
        createShape: {
          objectId: `${itemId}_title`,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: 650, unit: 'PT' },
              height: { magnitude: 25, unit: 'PT' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 30,
              translateY: yOffset,
              unit: 'PT',
            },
          },
        },
      },
      {
        insertText: {
          objectId: `${itemId}_title`,
          text: `${index + 1}. ${article.title.slice(0, 70)}${article.title.length > 70 ? '...' : ''}`,
        },
      },
      {
        updateTextStyle: {
          objectId: `${itemId}_title`,
          style: {
            fontSize: { magnitude: 14, unit: 'PT' },
            fontFamily: 'Arial',
            bold: true,
            link: { url: article.url },
            foregroundColor: { opaqueColor: { rgbColor: COLORS.primary } },
          },
          fields: 'fontSize,fontFamily,bold,link,foregroundColor',
        },
      },
      {
        createShape: {
          objectId: `${itemId}_meta`,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: 650, unit: 'PT' },
              height: { magnitude: 18, unit: 'PT' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 45,
              translateY: yOffset + 22,
              unit: 'PT',
            },
          },
        },
      },
      {
        insertText: {
          objectId: `${itemId}_meta`,
          text: `${article.source} | ${format(article.publishedAt, 'yyyy/MM/dd')}`,
        },
      },
      {
        updateTextStyle: {
          objectId: `${itemId}_meta`,
          style: {
            fontSize: { magnitude: 10, unit: 'PT' },
            fontFamily: 'Arial',
            foregroundColor: { opaqueColor: { rgbColor: COLORS.secondary } },
          },
          fields: 'fontSize,fontFamily,foregroundColor',
        },
      }
    );
  });

  return requests;
}

// Detail slide - one article per slide with full summary
export function createDetailSlideRequests(
  slideId: string,
  article: NewsArticle,
  articleNumber: number
): Request[] {
  const requests: Request[] = [
    {
      createSlide: {
        objectId: slideId,
        slideLayoutReference: { predefinedLayout: 'BLANK' },
      },
    },
    // Article number badge
    {
      createShape: {
        objectId: `${slideId}_badge`,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 40, unit: 'PT' },
            height: { magnitude: 30, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 30,
            translateY: 25,
            unit: 'PT',
          },
        },
      },
    },
    {
      insertText: {
        objectId: `${slideId}_badge`,
        text: `#${articleNumber}`,
      },
    },
    {
      updateTextStyle: {
        objectId: `${slideId}_badge`,
        style: {
          fontSize: { magnitude: 14, unit: 'PT' },
          fontFamily: 'Arial',
          bold: true,
          foregroundColor: { opaqueColor: { rgbColor: COLORS.secondary } },
        },
        fields: 'fontSize,fontFamily,bold,foregroundColor',
      },
    },
    // Title
    {
      createShape: {
        objectId: `${slideId}_title`,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 650, unit: 'PT' },
            height: { magnitude: 60, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 30,
            translateY: 55,
            unit: 'PT',
          },
        },
      },
    },
    {
      insertText: {
        objectId: `${slideId}_title`,
        text: article.title,
      },
    },
    {
      updateTextStyle: {
        objectId: `${slideId}_title`,
        style: {
          fontSize: { magnitude: 22, unit: 'PT' },
          fontFamily: 'Arial',
          bold: true,
          link: { url: article.url },
          foregroundColor: { opaqueColor: { rgbColor: COLORS.primary } },
        },
        fields: 'fontSize,fontFamily,bold,link,foregroundColor',
      },
    },
    // Meta info
    {
      createShape: {
        objectId: `${slideId}_meta`,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 650, unit: 'PT' },
            height: { magnitude: 25, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 30,
            translateY: 115,
            unit: 'PT',
          },
        },
      },
    },
    {
      insertText: {
        objectId: `${slideId}_meta`,
        text: `📰 ${article.source}  |  📅 ${format(article.publishedAt, 'yyyy年MM月dd日')}`,
      },
    },
    {
      updateTextStyle: {
        objectId: `${slideId}_meta`,
        style: {
          fontSize: { magnitude: 12, unit: 'PT' },
          fontFamily: 'Arial',
          foregroundColor: { opaqueColor: { rgbColor: COLORS.secondary } },
        },
        fields: 'fontSize,fontFamily,foregroundColor',
      },
    },
    // Divider line
    {
      createShape: {
        objectId: `${slideId}_divider`,
        shapeType: 'RECTANGLE',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 650, unit: 'PT' },
            height: { magnitude: 2, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 30,
            translateY: 145,
            unit: 'PT',
          },
        },
      },
    },
    {
      updateShapeProperties: {
        objectId: `${slideId}_divider`,
        shapeProperties: {
          shapeBackgroundFill: {
            solidFill: {
              color: { rgbColor: COLORS.lightGray },
            },
          },
          outline: { propertyState: 'NOT_RENDERED' },
        },
        fields: 'shapeBackgroundFill,outline',
      },
    },
    // Summary header
    {
      createShape: {
        objectId: `${slideId}_summary_header`,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: 100, unit: 'PT' },
            height: { magnitude: 25, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 30,
            translateY: 160,
            unit: 'PT',
          },
        },
      },
    },
    {
      insertText: {
        objectId: `${slideId}_summary_header`,
        text: '📝 要約',
      },
    },
    {
      updateTextStyle: {
        objectId: `${slideId}_summary_header`,
        style: {
          fontSize: { magnitude: 14, unit: 'PT' },
          fontFamily: 'Arial',
          bold: true,
          foregroundColor: { opaqueColor: { rgbColor: COLORS.secondary } },
        },
        fields: 'fontSize,fontFamily,bold,foregroundColor',
      },
    },
  ];

  // Summary content
  const summaryText = article.summary?.trim() || article.description?.trim();
  if (summaryText) {
    requests.push(
      {
        createShape: {
          objectId: `${slideId}_summary`,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: 650, unit: 'PT' },
              height: { magnitude: 200, unit: 'PT' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 30,
              translateY: 190,
              unit: 'PT',
            },
          },
        },
      },
      {
        insertText: {
          objectId: `${slideId}_summary`,
          text: summaryText.slice(0, 800),
        },
      },
      {
        updateTextStyle: {
          objectId: `${slideId}_summary`,
          style: {
            fontSize: { magnitude: 14, unit: 'PT' },
            fontFamily: 'Arial',
            foregroundColor: { opaqueColor: { rgbColor: COLORS.secondary } },
          },
          fields: 'fontSize,fontFamily,foregroundColor',
        },
      }
    );
  }

  return requests;
}

// Legacy function for backwards compatibility
export function createNewsSlideRequests(
  slideId: string,
  articles: NewsArticle[],
  pageNumber: number
): Request[] {
  return createTocSlideRequests(slideId, articles, pageNumber);
}
