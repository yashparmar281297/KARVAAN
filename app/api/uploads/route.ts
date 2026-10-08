import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getViewer } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/store";

const MAX_BYTES = 8 * 1024 * 1024;

/** Recognise the file by its first bytes, not by what the browser claims. */
function sniff(b: Uint8Array): "jpg" | "png" | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  return null;
}

/** Saves one already-cropped photo and returns its URL. */
export async function POST(req: Request) {
  // Any logged-in member (or the site admin) can upload photos for their own content.
  if (!(await getViewer())) return Response.json({ error: "Log in to upload photos." }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) return Response.json({ error: "No image received." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Image is larger than 8 MB." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniff(bytes);
  if (!ext) return Response.json({ error: "Only JPEG or PNG images are accepted." }, { status: 415 });

  const name = `${randomUUID()}.${ext}`;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, name), bytes);
  return Response.json({ url: `/api/uploads/${name}` });
}
