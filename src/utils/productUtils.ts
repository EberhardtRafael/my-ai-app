export function getSizeLabel(size: string | null): string {
  if (!size) return '';
  const sizeMap: Record<string, string> = {
    S: 'Small',
    M: 'Medium',
    L: 'Large',
    XL: 'Extra Large',
  };
  return sizeMap[size] || size;
}
