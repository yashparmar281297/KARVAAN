"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ASPECT, IMAGE_SPECS, type ImageKind } from "@/lib/images";
import { ImageCropper } from "./ImageCropper";

async function upload(blob: Blob): Promise<string> {
  const body = new FormData();
  body.append("file", blob, "photo.jpg");
  const res = await fetch("/api/uploads", { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed.");
  return json.url;
}

/** Pick → crop to the standard frame → upload. Calls back with the saved URL. */
function usePhotoPicker(kind: ImageKind, onSaved: (url: string) => void) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const picker = (
    <>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) {
            setError(null);
            setFile(f);
          }
        }}
      />
      {file && (
        <ImageCropper
          file={file}
          spec={IMAGE_SPECS[kind]}
          onCancel={() => setFile(null)}
          onDone={async (blob) => {
            setFile(null);
            setBusy(true);
            try {
              onSaved(await upload(blob));
            } catch (e) {
              setError(e instanceof Error ? e.message : "Upload failed.");
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </>
  );
  return { open: () => input.current?.click(), picker, busy, error };
}

/** One photo in its fixed frame (e.g. a 4:5 profile photo or a 16:9 cover). */
export function ImageField({ kind, value, onChange, label, required }: { kind: ImageKind; value?: string; onChange: (url?: string) => void; label?: string; required?: boolean }) {
  const spec = IMAGE_SPECS[kind];
  const id = useId();
  const { open, picker, busy, error } = usePhotoPicker(kind, onChange);
  const width = kind === "cover" ? "w-full" : kind === "logo" ? "w-32" : "w-full max-w-[260px]";

  return (
    <div>
      <p id={id} className="label mb-2 flex items-center gap-2">
        {label ?? spec.label}
        {required && <span className="text-ember">*</span>}
        <span className="text-mute">· {spec.ratio}</span>
      </p>
      <button
        type="button"
        aria-labelledby={id}
        onClick={open}
        disabled={busy}
        className={`group relative block ${width} ${ASPECT[kind]} overflow-hidden bg-graphite hairline transition hover:bg-charcoal ${spec.round ? "rounded-full" : "rounded-[3px]"}`}
      >
        {value ? (
          <>
            <Image src={value} alt="" fill sizes={kind === "cover" ? "(max-width: 768px) 100vw, 640px" : "260px"} className="object-cover" />
            <span className="label absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-ink/70 py-2 text-ivory opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-visible:opacity-100">
              <Icon name="camera" size={13} /> Change
            </span>
          </>
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-dashed border-line-strong p-3 text-center text-silver transition group-hover:border-ivory group-hover:text-ivory" style={{ borderRadius: "inherit" }}>
            <Icon name={busy ? "gauge" : "upload"} size={20} />
            <span className="label !text-[10px]">{busy ? "Uploading…" : "Upload photo"}</span>
            {kind !== "logo" && <span className="text-[11px] leading-snug text-mute">{spec.ratio} · {spec.width}×{spec.height}</span>}
          </span>
        )}
      </button>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-mute">{spec.hint}</p>
      {value && (
        <button type="button" onClick={() => onChange(undefined)} className="label mt-2 flex items-center gap-1.5 !text-[10px] text-mute hover:text-ivory">
          <Icon name="trash" size={12} /> Remove
        </button>
      )}
      {error && <p className="mt-2 text-sm text-ember">{error}</p>}
      {picker}
    </div>
  );
}

/** Extra photos, all in the same fixed frame. */
export function GalleryField({ kind, value, onChange, max = 8, label = "More photos" }: { kind: ImageKind; value: string[]; onChange: (urls: string[]) => void; max?: number; label?: string }) {
  const spec = IMAGE_SPECS[kind];
  const { open, picker, busy, error } = usePhotoPicker(kind, (url) => onChange([...value, url]));
  return (
    <div>
      <p className="label mb-2">
        {label} <span className="text-mute">· {spec.ratio} · up to {max}</span>
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((src, i) => (
          <div key={src} className={`relative ${ASPECT[kind]} overflow-hidden rounded-[3px] bg-graphite hairline`}>
            <Image src={src} alt={`Photo ${i + 1}`} fill sizes="160px" className="object-cover" />
            <button type="button" onClick={() => onChange(value.filter((x) => x !== src))} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-ink/75 text-ivory backdrop-blur hover:bg-ivory hover:text-ink" aria-label={`Remove photo ${i + 1}`}>
              <Icon name="close" size={13} />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button type="button" onClick={open} disabled={busy} className={`flex ${ASPECT[kind]} flex-col items-center justify-center gap-1.5 rounded-[3px] border border-dashed border-line-strong text-silver transition hover:border-ivory hover:text-ivory`}>
            <Icon name={busy ? "gauge" : "plus"} size={18} />
            <span className="label !text-[9px]">{busy ? "Uploading…" : "Add"}</span>
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-ember">{error}</p>}
      {picker}
    </div>
  );
}
