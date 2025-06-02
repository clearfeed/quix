import { z } from 'zod';

function removeNulls(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(removeNulls);
  } else if (obj && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      const value = (obj as any)[key];
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
