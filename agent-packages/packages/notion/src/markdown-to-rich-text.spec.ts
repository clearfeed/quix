import { markdownToNotionRichText } from './markdown-to-rich-text';

describe('markdownToNotionRichText', () => {
  it('returns undefined for blank input by default', () => {
    expect(markdownToNotionRichText()).toBeUndefined();
    expect(markdownToNotionRichText('   ')).toBeUndefined();
  });

  it('returns empty rich_text when allowBlank is true', () => {
    expect(markdownToNotionRichText('', { allowBlank: true })).toEqual([]);
  });

  it('converts plain text', () => {
    expect(markdownToNotionRichText('hello')).toEqual([
      {
        type: 'text',
        text: { content: 'hello' }
      }
    ]);
  });

  it('supports nested bold and italic formatting', () => {
    expect(markdownToNotionRichText('**bold with *italic* text**')).toEqual([
      {
        type: 'text',
        text: { content: 'bold with ' },
        annotations: { bold: true }
      },
      {
        type: 'text',
        text: { content: 'italic' },
        annotations: { bold: true, italic: true }
      },
      {
        type: 'text',
        text: { content: ' text' },
        annotations: { bold: true }
      }
    ]);
  });

  it('handles markdown links with titles and keeps only URL target', () => {
    expect(markdownToNotionRichText('[docs](https://example.com/path "Example")')).toEqual([
      {
        type: 'text',
        text: {
          content: 'docs',
          link: { url: 'https://example.com/path' }
        }
      }
    ]);
  });

  it('handles links whose URLs contain nested parentheses', () => {
    expect(markdownToNotionRichText('[docs](https://example.com/a(b)c)')).toEqual([
      {
        type: 'text',
        text: {
          content: 'docs',
          link: { url: 'https://example.com/a(b)c' }
        }
      }
    ]);
  });

  it('normalizes CRLF line endings', () => {
    expect(markdownToNotionRichText('line1\r\nline2')).toEqual([
      {
        type: 'text',
        text: { content: 'line1\nline2' }
      }
    ]);
  });
});
