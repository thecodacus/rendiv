export function staticFile(path: string): string {
  const cleaned = path.startsWith('/') ? path.slice(1) : path;
  return `/${cleaned}`;
}
