import type {
  InlineAnnotation,
  MarkdownToken,
  MarkdownTokenType,
  NotionRichText,
  NotionTextItem
} from './types';

function isBlank(value?: string): boolean {
  return value === undefined || value.trim().length === 0;
}

function buildNotionTextItem(
  content: string,
  annotations: Record<string, boolean> = {},
  link?: string
): NotionTextItem {
  const cleanedAnnotations = Object.fromEntries(
    Object.entries(annotations).filter(([, enabled]) => enabled)
  ) as InlineAnnotation;

  return {
    type: 'text',
    text: {
      content,
      ...(link ? { link: { url: link } } : {})
    },
    ...(Object.keys(cleanedAnnotations).length > 0 ? { annotations: cleanedAnnotations } : {})
  };
}

function isLikelyLinkTarget(target: string): boolean {
  if (isBlank(target)) {
    return false;
  }

  // Accept absolute URLs/schemes (including mailto:) plus relative and anchor links.
  return /^(?:[A-Za-z][A-Za-z0-9+.-]*:|\/|#)/.test(target.trim());
}

function findMarkdownLink(text: string): MarkdownToken | undefined {
  let searchFrom = 0;
  while (searchFrom < text.length) {
    const openBracket = text.indexOf('[', searchFrom);
    if (openBracket === -1) {
      return undefined;
    }

    const closeBracket = text.indexOf(']', openBracket + 1);
    if (closeBracket === -1 || closeBracket === openBracket + 1) {
      searchFrom = openBracket + 1;
      continue;
    }

    if (text[closeBracket + 1] !== '(') {
      searchFrom = openBracket + 1;
      continue;
    }

    let depth = 1;
    let cursor = closeBracket + 2;
    let containsNewline = false;
    while (cursor < text.length) {
      const char = text[cursor];
      if (char === '\n') {
        containsNewline = true;
        break;
      }
      if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
        if (depth === 0) {
          break;
        }
      }
      cursor += 1;
    }

    if (containsNewline || depth !== 0) {
      searchFrom = openBracket + 1;
      continue;
    }

    const label = text.slice(openBracket + 1, closeBracket);
    const url = text.slice(closeBracket + 2, cursor).trim();
    if (isBlank(label) || !isLikelyLinkTarget(url)) {
      searchFrom = openBracket + 1;
      continue;
    }

    return {
      type: 'link',
      index: openBracket,
      raw: text.slice(openBracket, cursor + 1),
      content: label,
      url
    };
  }

  return undefined;
}

function findRegexToken(
  text: string,
  type: Exclude<MarkdownTokenType, 'link'>,
  regex: RegExp,
  contentGroupIndexes: number[]
): MarkdownToken | undefined {
  const match = regex.exec(text);
  if (!match) {
    return undefined;
  }

  const content = contentGroupIndexes.map((index) => match[index]).find((value) => !isBlank(value));
  if (isBlank(content)) {
    return undefined;
  }

  return {
    type,
    index: match.index ?? 0,
    raw: match[0],
    content: content as string
  };
}

function findNextMarkdownToken(text: string): MarkdownToken | undefined {
  // Order matters for ties at same index.
  const tokenPrecedence: Record<MarkdownTokenType, number> = {
    link: 0,
    code: 1,
    bold: 2,
    italic: 3,
    strikethrough: 4
  };

  const tokenCandidates: MarkdownToken[] = [
    findMarkdownLink(text),
    findRegexToken(text, 'code', /`([^`\n]+)`/, [1]),
    findRegexToken(text, 'bold', /\*\*([^\n]+?)\*\*|__([^\n]+?)__/, [1, 2]),
    findRegexToken(
      text,
      'italic',
      /(?<!\*)\*(?!\*)([^\n]+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)([^\n]+?)(?<!_)_(?!_)/,
      [1, 2]
    ),
    findRegexToken(text, 'strikethrough', /~~([^\n]+?)~~/, [1])
  ].filter((token): token is MarkdownToken => token !== undefined);

  if (tokenCandidates.length === 0) {
    return undefined;
  }

  return tokenCandidates.reduce((best, current) => {
    if (current.index < best.index) {
      return current;
    }
    if (
      current.index === best.index &&
      tokenPrecedence[current.type] < tokenPrecedence[best.type]
    ) {
      return current;
    }
    return best;
  });
}

function parseInlineMarkdown(
  text: string,
  annotations: Record<string, boolean> = {},
  link?: string
): NotionTextItem[] {
  const items: NotionTextItem[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const nextToken = findNextMarkdownToken(remaining);
    if (!nextToken) {
      items.push(buildNotionTextItem(remaining, annotations, link));
      break;
    }

    const tokenStart = nextToken.index;
    if (tokenStart > 0) {
      items.push(buildNotionTextItem(remaining.slice(0, tokenStart), annotations, link));
    }

    const tokenText = nextToken.raw;
    switch (nextToken.type) {
      case 'link': {
        items.push(...parseInlineMarkdown(nextToken.content, annotations, nextToken.url));
        break;
      }
      case 'code': {
        items.push(buildNotionTextItem(nextToken.content, { ...annotations, code: true }, link));
        break;
      }
      case 'bold': {
        items.push(...parseInlineMarkdown(nextToken.content, { ...annotations, bold: true }, link));
        break;
      }
      case 'italic': {
        items.push(
          ...parseInlineMarkdown(nextToken.content, { ...annotations, italic: true }, link)
        );
        break;
      }
      case 'strikethrough': {
        items.push(
          ...parseInlineMarkdown(nextToken.content, { ...annotations, strikethrough: true }, link)
        );
        break;
      }
    }

    remaining = remaining.slice(tokenStart + tokenText.length);
  }

  return items.filter((item) => !isBlank(item.text?.content));
}

// Converts markdown to the Notion rich_text request format.
// This is intentionally a limited inline markdown subset.
export function markdownToNotionRichText(markdown?: string): NotionRichText | undefined {
  if (isBlank(markdown)) {
    return undefined;
  }

  const normalizedMarkdown = (markdown as string).replace(/\r\n/g, '\n');
  const parsedItems = parseInlineMarkdown(normalizedMarkdown);
  return parsedItems.length > 0 ? (parsedItems as NotionRichText) : undefined;
}
