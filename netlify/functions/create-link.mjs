import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const key = context.params.key;
  const imagesStore = getStore("images");

  const entry = await imagesStore.getWithMetadata(key, { type: "arrayBuffer" });

  if (!entry) {
    return new Response("Not found", { status: 404 });
  }

  const contentType = entry.metadata?.contentType || "image/jpeg";

  return new Response(entry.data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

export const config = {
  path: "/img/:key",
};
