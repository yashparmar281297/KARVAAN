import Image from "next/image";

/**
 * A photo that fills its frame edge to edge (cover). `focus` picks which part
 * of the photo stays in view when the frame's shape differs from the photo's.
 * Fills its positioned parent.
 */
export function FittedImage({
  src,
  alt,
  sizes,
  preload,
  focus = "50% 55%",
  quality,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  preload?: boolean;
  /** CSS object-position, e.g. "50% 60%". */
  focus?: string;
  quality?: number;
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} preload={preload} quality={quality} className="object-cover" style={{ objectPosition: focus }} />
    </div>
  );
}
