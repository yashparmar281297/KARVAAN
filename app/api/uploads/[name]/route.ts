import fs from "node:fs";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/store";

const NAME = /^[a-f0-9-]{36}\.(jpg|png)$/;

/** Serves a saved upload. Names are random UUIDs and never change, so cache forever. */
export async function GET(_req: Request, ctx: RouteContext<"/api/uploads/[name]">) {
  const { name } = await ctx.params;
  if (!NAME.test(name)) return new Response("Not found", { status: 404 });
  let data: Buffer;
  try {
    data = fs.readFileSync(path.join(UPLOAD_DIR, name));
  } catch {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": name.endsWith(".png") ? "image/png" : "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
