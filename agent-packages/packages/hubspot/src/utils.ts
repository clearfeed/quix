export function validateRequiredFields<T extends Record<string, any>>({
  params,
  requiredFields,
}: {
  params: T;
  requiredFields: (keyof T)[];
}) {
  for (const field of requiredFields) {
    if (!params[field]) {
      throw new Error(`Missing required field: ${String(field)}`);
    }
  }
}
