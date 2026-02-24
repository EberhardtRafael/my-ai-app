// Map color names to hex codes for placeholder images
const colorMap: { [key: string]: string } = {
  Navy: '1e3a8a',
  Charcoal: '374151',
  Olive: '6b7c3e',
  Burgundy: '7c2d37',
  Cream: 'faf8f3',
  Red: 'ef4444',
  Blue: '3b82f6',
  Green: '22c55e',
  Yellow: 'eab308',
  Black: '1f2937',
  White: 'f3f4f6',
  Gray: '9ca3af',
  Grey: '9ca3af',
  Purple: 'a855f7',
  Pink: 'ec4899',
  Orange: 'f97316',
  Brown: '92400e',
  Beige: 'd6c8b4',
};

export function getColorHex(colorName: string): string {
  return colorMap[colorName] || '9ca3af'; // default to gray
}

export function getProductImageUrl(
  color?: string,
  width: number = 400,
  height: number = 400
): string {
  const hex = color ? getColorHex(color) : '9ca3af';
  return `https://placehold.co/${width}x${height}/${hex}/white?text=Product`;
}
