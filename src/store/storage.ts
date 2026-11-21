/** Returns stored JSON only if it parses; corrupt data is dropped so the app reseeds instead of hanging. */
export function sanitizeStored(raw: string | null): string | null {
  if (raw == null) return null;
  try {
    JSON.parse(raw);
    return raw;
  } catch {
    return null;
  }
}
