export function slugifyName(value: string): string {
  const base = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 145)
    .replace(/-+$/g, '');
  return base || 'item';
}

export async function generateUniqueSlug(
  name: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const base = slugifyName(name);
  if (!(await isTaken(base))) return base;
  let suffix = 2;
  while (suffix < 10000) {
    const candidate = `${base}-${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
    suffix++;
  }
  return `${base}-${Date.now()}`;
}
