import {
  createCommentSchema,
  createDatabaseItemSchema,
  queryDatabaseSchema,
  searchSchema,
  updatePagePropertiesSchema
} from './schema';

describe('notion schemas', () => {
  it('accepts createComment parent without explicit type', () => {
    expect(
      createCommentSchema.parse({
        parent: { page_id: '12345678-1234-1234-1234-123456789abc' },
        markdown: 'hello'
      })
    ).toBeTruthy();
  });

  it('requires exactly one of parent or discussion_id for createComment', () => {
    expect(() => createCommentSchema.parse({ markdown: 'hello' })).toThrow(
      'Provide exactly one of `parent` or `discussion_id`.'
    );
    expect(() =>
      createCommentSchema.parse({
        parent: { block_id: '12345678-1234-1234-1234-123456789abc' },
        discussion_id: '12345678-1234-1234-1234-123456789abc',
        markdown: 'hello'
      })
    ).toThrow('Provide exactly one of `parent` or `discussion_id`.');
  });

  it('accepts createDatabaseItem parent without explicit type', () => {
    expect(
      createDatabaseItemSchema.parse({
        parent: { database_id: '12345678-1234-1234-1234-123456789abc' }
      })
    ).toBeTruthy();
  });

  it('accepts nullable/optional fields in queryDatabase and search', () => {
    expect(
      queryDatabaseSchema.parse({
        database_id: '12345678-1234-1234-1234-123456789abc',
        filter: null,
        sorts: null
      })
    ).toBeTruthy();
    expect(searchSchema.parse({ filter: null, sort: null })).toBeTruthy();
  });

  it('accepts page_id-only or null properties in updatePageProperties', () => {
    expect(
      updatePagePropertiesSchema.parse({
        page_id: '12345678-1234-1234-1234-123456789abc'
      })
    ).toBeTruthy();
    expect(
      updatePagePropertiesSchema.parse({
        page_id: '12345678-1234-1234-1234-123456789abc',
        properties: null
      })
    ).toBeTruthy();
  });
});
