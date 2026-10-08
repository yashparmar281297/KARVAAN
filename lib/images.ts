// The image standard. Every upload is cropped to one of these frames in the
// browser before it's saved (like Instagram / LinkedIn), and every place that
// shows the photo uses the same frame — so nothing gets cut off on display.

export type ImageKind = "portrait" | "vehicle" | "post" | "cover" | "logo";

export interface ImageSpec {
  kind: ImageKind;
  label: string;
  ratio: string; // shown to the person uploading
  aspect: number; // width ÷ height
  width: number; // saved size, px
  height: number;
  round?: boolean; // shown in a circle (logos)
  hint: string;
}

export const IMAGE_SPECS: Record<ImageKind, ImageSpec> = {
  portrait: { kind: "portrait", label: "Profile photo", ratio: "4:5", aspect: 4 / 5, width: 1080, height: 1350, hint: "Portrait, like an Instagram post. Keep your face in the upper half." },
  vehicle: { kind: "vehicle", label: "Vehicle photo", ratio: "4:5", aspect: 4 / 5, width: 1080, height: 1350, hint: "Portrait, like an Instagram post. Fit the whole car or bike in the frame." },
  post: { kind: "post", label: "Photo", ratio: "4:5", aspect: 4 / 5, width: 1080, height: 1350, hint: "Portrait, like an Instagram post." },
  cover: { kind: "cover", label: "Cover photo", ratio: "16:9", aspect: 16 / 9, width: 1920, height: 1080, hint: "Wide banner, like a LinkedIn or YouTube cover." },
  logo: { kind: "logo", label: "Logo", ratio: "1:1", aspect: 1, width: 600, height: 600, round: true, hint: "Square — shown in a circle. Keep the mark centred." },
};

/** Tailwind aspect class for each frame. */
export const ASPECT: Record<ImageKind, string> = {
  portrait: "aspect-[4/5]",
  vehicle: "aspect-[4/5]",
  post: "aspect-[4/5]",
  cover: "aspect-video",
  logo: "aspect-square",
};

/** Only images saved by our own upload endpoint are accepted in records. */
export const UPLOAD_URL = /^\/api\/uploads\/[a-f0-9-]{36}\.(jpg|png)$/;
