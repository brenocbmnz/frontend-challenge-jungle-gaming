import type { ImgHTMLAttributes } from "react";
import { artworkSrcSet, THUMBNAIL_WIDTHS } from "../lib/artwork";
/** Responsive encodings of the original Figma artwork; originals remain in public/assets. */
export function Artwork({
  src,
  loading = "lazy",
  thumbnail = false,
  sizes = "(max-width: 768px) 45vw, 450px",
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { thumbnail?: boolean }) {
  const base =
    typeof src === "string" &&
    /^\/assets\/(8f387|83794|9add2|b7cfc)\.png$/.test(src)
      ? src.slice(0, -4)
      : undefined;
  return (
    <img
      {...props}
      src={base ? `${base}-${thumbnail ? 128 : 480}.webp` : src}
      srcSet={
        base
          ? artworkSrcSet(base, thumbnail ? THUMBNAIL_WIDTHS : undefined)
          : undefined
      }
      sizes={base ? sizes : undefined}
      loading={loading}
    />
  );
}
