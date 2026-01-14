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

export function createNewsSlideRequests(
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
        text: `今週のAIニュース (${pageNumber})`,
      },
    },
    {
      updateTextStyle: {
        objectId: `${slideId}_header`,
        style: {
          fontSize: { magnitude: 28, unit: 'PT' },
          fontFamily: 'Arial',
          bold: true,
          foregroundColor: { opaqueColor: { rgbColor: COLORS.primary } },
        },
        fields: 'fontSize,fontFamily,bold,foregroundColor',
      },
    },
  ];

  articles.forEach((article, index) => {
    const yOffset = 80 + index * 85;
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
              height: { magnitude: 30, unit: 'PT' },
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
          text: article.title.slice(0, 80) + (article.title.length > 80 ? '...' : ''),
        },
      },
      {
        updateTextStyle: {
          objectId: `${itemId}_title`,
          style: {
            fontSize: { magnitude: 16, unit: 'PT' },
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
              height: { magnitude: 20, unit: 'PT' },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 30,
              translateY: yOffset + 28,
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
            fontSize: { magnitude: 12, unit: 'PT' },
            fontFamily: 'Arial',
            foregroundColor: { opaqueColor: { rgbColor: COLORS.secondary } },
          },
          fields: 'fontSize,fontFamily,foregroundColor',
        },
      },
    );

    // Only add description if it exists
    const descText = article.description?.trim();
    if (descText) {
      requests.push(
        {
          createShape: {
            objectId: `${itemId}_desc`,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: {
                width: { magnitude: 650, unit: 'PT' },
                height: { magnitude: 30, unit: 'PT' },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 30,
                translateY: yOffset + 48,
                unit: 'PT',
              },
            },
          },
        },
        {
          insertText: {
            objectId: `${itemId}_desc`,
            text:
              descText.slice(0, 120) +
              (descText.length > 120 ? '...' : ''),
          },
        },
        {
          updateTextStyle: {
            objectId: `${itemId}_desc`,
            style: {
              fontSize: { magnitude: 11, unit: 'PT' },
              fontFamily: 'Arial',
              foregroundColor: { opaqueColor: { rgbColor: COLORS.secondary } },
            },
            fields: 'fontSize,fontFamily,foregroundColor',
          },
        }
      );
    }
  });

  return requests;
}
