export function getApiUrl(path: string): string {
  const base = '/listeny';
  if (!path) return base;
  if (path.startsWith('http')) return path;
  if (path.startsWith(base)) return path;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
