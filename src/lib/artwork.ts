/** Shared candidates keep responsive image preloads aligned with rendered images. */
export const ARTWORK_WIDTHS = [320, 384, 480, 640, 960] as const;
export const THUMBNAIL_WIDTHS = [64, 128, 192] as const;
export function artworkSrcSet(
  base: string,
  widths: readonly number[] = ARTWORK_WIDTHS,
) {
  return widths.map((width) => `${base}-${width}.webp ${width}w`).join(", ");
}
