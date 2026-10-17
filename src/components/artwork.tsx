import type { ImgHTMLAttributes } from "react";
/** Responsive encodings of the original Figma artwork; originals remain in public/assets. */
export function Artwork({
  src,
  loading = "lazy",
  sizes = "(max-width: 768px) 45vw, 450px",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const base =
    typeof src === "string" &&
    /^\/assets\/(8f387|83794|9add2|b7cfc)\.png$/.test(src)
      ? src.slice(0, -4)
      : undefined;
  return (
    <img
      {...props}
      src={base ? `${base}-480.webp` : src}
      srcSet={
        base
          ? `${base}-320.webp 320w, ${base}-480.webp 480w, ${base}-960.webp 960w`
          : undefined
      }
      sizes={base ? sizes : undefined}
      loading={loading}
    />
  );
}
