// Serves one of the invented paper-DO sample images. Only the two known ids are served, and only through the manifest-enforcing loader.

import { isDoImageId, loadDoImage } from "@/data/photos";

const NOT_FOUND = 404;
const CACHE_SECONDS = 3600;

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  if (!isDoImageId(id)) return new Response("Not found", { status: NOT_FOUND });
  const { bytes, mediaType } = loadDoImage(id);
  return new Response(new Uint8Array(bytes), { headers: { "content-type": mediaType, "cache-control": `public, max-age=${CACHE_SECONDS}` } });
}
