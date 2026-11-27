// Original 8 by 8 pixel drawings (design brief): no operating system icons or artwork.
const BITS = {
  home: '0001100000111100011111101111111101111110011001100110011001100110',
  trophy: '1111111110111101101111010111111000111100000110000001100000111100',
  folder: '0000000011100000111111111000000110000001100000011000000111111111',
  link: '0000111100000011000001010000100111010000100000001000010011111100',
  doc: '0111110001000110010000100111101001000010011110100100001001111110',
  // Board squares: a checkerboard.
  board: '1100110011001100001100110011001111001100110011000011001100110011',
} as const;

export type IconName = keyof typeof BITS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const pixels = [...BITS[name]].flatMap((bit, i) =>
    bit === '1'
      ? [<rect key={i} x={i % 8} y={Math.floor(i / 8)} width="1.02" height="1.02" />]
      : [],
  );
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
    >
      {pixels}
    </svg>
  );
}
