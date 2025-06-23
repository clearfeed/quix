import { z } from 'zod';

function removeNulls(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(removeNulls);
  } else if (obj && typeof obj === 'object') {
    const newObj: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const value = (obj as Record<string, unknown>)[key];
      if (value !== null) {
        newObj[key] = removeNulls(value);
      }
    }
    return newObj;
  }
  return obj;
}

export function withNullPreprocessing<T extends z.ZodTypeAny>(schema: T): any {
  return z.preprocess(removeNulls, schema);
}
