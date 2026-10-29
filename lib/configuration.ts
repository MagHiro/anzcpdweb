/** Presence checks must not present deployment placeholders as working credentials. */
export function hasRealCredential(value?: string): boolean {
  return Boolean(value?.trim()) && !/placeholder|replace[_-]?me|changeme|your[_-]|example/i.test(value ?? "");
}
