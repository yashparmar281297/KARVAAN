"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import type { ImageSpec } from "@/lib/images";

const MAX_ZOOM = 5;

/**
 * Full-screen crop step, like Instagram's: the frame has the fixed shape for
 * this kind of photo; you drag the picture to position it and pinch / scroll /
 * slide to zoom. What's inside the frame is exactly what gets saved and shown.
 */
export function ImageCropper({ file, spec, onCancel, onDone }: { file: File; spec: ImageSpec; onCancel: () => void; onDone: (blob: Blob) => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  // Image top-left inside the frame, px. null = centred (the starting position).
  const [rawPos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<number | null>(null);

  // Load the chosen file.
  useEffect(() => {
    const src = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => setImg(el);
    el.onerror = () => setError("This file can't be opened as an image. Try a JPG or PNG.");
    el.src = src;
    return () => URL.revokeObjectURL(src);
  }, [file]);

  // Track the frame size.
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const base = img && box.w ? Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight) : 1;
  const scale = base * zoom;

  const clamp = useCallback(
    (p: { x: number; y: number }, s: number) => {
      if (!img) return p;
      const minX = box.w - img.naturalWidth * s;
      const minY = box.h - img.naturalHeight * s;
      return { x: Math.min(0, Math.max(minX, p.x)), y: Math.min(0, Math.max(minY, p.y)) };
    },
    [img, box],
  );

  const centred = useMemo(() => (img ? { x: (box.w - img.naturalWidth * scale) / 2, y: (box.h - img.naturalHeight * scale) / 2 } : { x: 0, y: 0 }), [img, box, scale]);
  // Always within bounds, even after the frame is resized.
  const pos = clamp(rawPos ?? centred, scale);

  /** Zoom keeping the point (cx, cy) of the frame fixed under the finger/cursor. */
  const zoomTo = useCallback(
    (next: number, cx = box.w / 2, cy = box.h / 2) => {
      const z = Math.min(MAX_ZOOM, Math.max(1, next));
      const prevS = base * zoom;
      const nextS = base * z;
      setZoom(z);
      setPos((raw) => {
        const p = clamp(raw ?? centred, prevS);
        return clamp({ x: cx - ((cx - p.x) / prevS) * nextS, y: cy - ((cy - p.y) / prevS) * nextS }, nextS);
      });
    },
    [base, box, clamp, zoom, centred],
  );

  const local = (e: { clientX: number; clientY: number }) => {
    const r = frame.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    frame.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pinch.current = null;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      setPos((raw) => {
        const p = clamp(raw ?? centred, scale);
        return clamp({ x: p.x + e.clientX - prev.x, y: p.y + e.clientY - prev.y }, scale);
      });
    } else if (pts.length === 2) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinch.current) {
        const mid = local({ clientX: (pts[0].x + pts[1].x) / 2, clientY: (pts[0].y + pts[1].y) / 2 });
        zoomTo(zoom * (d / pinch.current), mid.x, mid.y);
      }
      pinch.current = d;
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
  };

  // Wheel / trackpad zoom (non-passive so the page doesn't scroll).
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomTo(zoom * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom, zoomTo]);

  // Keyboard: arrows move, +/- zoom, Esc cancels, Enter saves.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 40 : 10;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      setPos(clamp({ x: pos.x + moves[e.key][0], y: pos.y + moves[e.key][1] }, scale));
    } else if (e.key === "+" || e.key === "=") zoomTo(zoom * 1.1);
    else if (e.key === "-") zoomTo(zoom / 1.1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  const save = () => {
    if (!img || saving) return;
    setSaving(true);
    const canvas = document.createElement("canvas");
    canvas.width = spec.width;
    canvas.height = spec.height;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#0a0a0b";
    ctx.fillRect(0, 0, spec.width, spec.height);
    ctx.drawImage(img, -pos.x / scale, -pos.y / scale, box.w / scale, box.h / scale, 0, 0, spec.width, spec.height);
    canvas.toBlob(
      (blob) => {
        setSaving(false);
        if (blob) onDone(blob);
        else setError("Couldn't prepare the photo. Try another file.");
      },
      "image/jpeg",
      0.9,
    );
  };

  // Frame size: as large as fits, keeping the fixed shape.
  const frameStyle = { aspectRatio: String(spec.aspect), width: `min(92vw, 640px, calc((100svh - 270px) * ${spec.aspect.toFixed(4)}))` };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Crop ${spec.label.toLowerCase()}`} className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 overflow-y-auto bg-ink/95 p-4 backdrop-blur">
      <div className="text-center">
        <p className="label text-ember">
          {spec.label} · {spec.ratio}
        </p>
        <p className="mt-1.5 text-sm text-silver">Drag to position · pinch, scroll or slide to zoom</p>
      </div>

      <div
        ref={frame}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative flex-none cursor-grab touch-none select-none overflow-hidden bg-graphite outline-none ring-1 ring-ivory/40 focus-visible:ring-2 focus-visible:ring-ember active:cursor-grabbing"
        style={frameStyle}
      >
        {img && (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL, positioned by hand
          <img
            src={img.src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute left-0 top-0 max-w-none origin-top-left"
            style={{ width: img.naturalWidth, height: img.naturalHeight, transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }}
          />
        )}
        {!img && !error && <div className="absolute inset-0 grid place-items-center text-sm text-silver">Opening photo…</div>}
        {/* Rule-of-thirds guide */}
        <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="border-[0.5px] border-ivory/20" />
          ))}
        </div>
        {spec.round && <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(10,10,11,0.6)]" />}
      </div>

      <label className="flex w-full max-w-sm items-center gap-3 text-silver">
        <Icon name="minus" size={14} />
        <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={zoom} onChange={(e) => zoomTo(Number(e.target.value))} className="w-full accent-[var(--color-ember)]" aria-label="Zoom" />
        <Icon name="plus" size={14} />
      </label>

      {error && <p className="text-sm text-ember">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="btn btn-ghost chamfer">
          Cancel
        </button>
        <button type="button" onClick={save} disabled={!img || saving} className="btn btn-primary chamfer disabled:opacity-50">
          {saving ? "Saving…" : "Use photo"}
        </button>
      </div>
      <p className="label !text-[9.5px] text-mute">
        Saved at {spec.width}×{spec.height}
      </p>
    </div>,
    document.body,
  );
}
