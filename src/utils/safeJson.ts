export async function safeJson<T = unknown>(res: Response): Promise<T | null> {
  let text: string;
  try {
    text = await res.text();
  } catch (err) {
    console.error('Failed to read response:', err);
    return null;
  }
  if (!text) {
    console.error('Empty response from', res.url);
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('Invalid JSON from', res.url, err);
    return null;
  }
}
