export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}${path}`,
    options,
  );


  const text = await response.text();


  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }


  if (!response.ok) {
    throw new Error(
      typeof data === 'object' &&
      data !== null &&
      'message' in data
        ? String(data.message)
        : 'Request failed',
    );
  }


  return data as T;
}
