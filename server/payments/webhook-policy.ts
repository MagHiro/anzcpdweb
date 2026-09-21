export function shouldProcessWebhook(record: { processedAt: Date | null } | null): boolean {
  return !record?.processedAt;
}
