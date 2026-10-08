import { search } from "@/lib/data";
import "@/lib/store";

export const dynamic = "force-dynamic";

/** Search for the command palette (the data lives on the server). */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 120) ?? "";
  return Response.json(q.trim() ? search(q, 18) : []);
}
