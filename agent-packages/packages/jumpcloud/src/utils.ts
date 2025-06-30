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
    } else if (
      Array.isArray(value) &&
      value.every((item) => typeof item !== 'object' || item === null)
    ) {
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

export function extractErrorMessage(error: unknown): string {
  // Handle Axios errors specifically
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as any;

    // Try to extract error message from response data
    if (axiosError.response?.data) {
      const responseData = axiosError.response.data;

      // Handle different API error response formats
      if (typeof responseData === 'string') {
        return responseData;
      }

      if (typeof responseData === 'object') {
        // Try common error message fields
        const errorMessage =
          responseData.error?.message ||
          responseData.error ||
          responseData.message ||
          responseData.detail ||
          responseData.details ||
          JSON.stringify(responseData);

        if (errorMessage && typeof errorMessage === 'string') {
          return errorMessage;
        }
      }
    }

    // If no response data, include status code and status text
    if (axiosError.response?.status) {
      const statusInfo =
        `${axiosError.response.status} ${axiosError.response.statusText || ''}`.trim();
      return `Request failed with status code ${statusInfo}`;
    }

    // Network or request setup errors
    if (axiosError.code) {
      return `Network error: ${axiosError.code} - ${axiosError.message}`;
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback for unknown error types
  return 'An unknown error occurred';
}
