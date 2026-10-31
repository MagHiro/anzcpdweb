export function presenterInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return [words[0]?.[0], words.length > 1 ? words[words.length - 1][0] : undefined].filter(Boolean).join("").toUpperCase();
}
