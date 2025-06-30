export function extractPrimitives(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .map((item) => (typeof item !== 'object' || item === null ? item : extractPrimitives(item)))
      .filter((item) => item !== undefined);
  }
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      result[key] = value;
    } else if (typeof value !== 'object') {
      result[key] = value;
    } else if (Array.isArray(value) && value.every((item) => typeof item !== 'object' || item === null)) {
      result[key] = value;
    } else {
      const extracted = extractPrimitives(value);
      if (extracted !== undefined) {
        result[key] = extracted;
      }
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function validateRequiredFields({
  params,
  requiredFields
}: {
  params: Record<string, any>;
  requiredFields: string[];
}) {
  const missingFields = requiredFields.filter((field) => {
    if (field.includes('.')) {
      const parts = field.split('.');
      let current = params;
      for (const part of parts) {
        if (!current || current[part] === undefined) {
          return true;
        }
        current = current[part];
      }
      return false;
    }
    return params[field] === undefined;
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}
