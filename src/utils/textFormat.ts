export function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, ' ');
}

export function normalizeComparableText(value: string): string {
  return collapseSpaces((value || '').trim()).toLocaleLowerCase('fr');
}

export function capitalizeWords(value: string): string {
  const normalized = collapseSpaces((value || '').trimStart());
  return normalized.replace(/(^|[\s'-])([\p{L}])/gu, (_match, prefix: string, letter: string) =>
    `${prefix}${letter.toLocaleUpperCase('fr')}`
  );
}

export function capitalizeSentence(value: string): string {
  const normalized = collapseSpaces((value || '').trimStart());
  if (!normalized) return '';
  return normalized.charAt(0).toLocaleUpperCase('fr') + normalized.slice(1);
}

export function formatHumanName(value: string): string {
  return capitalizeWords(value)
    .split(' ')
    .filter(Boolean)
    .join(' ');
}
