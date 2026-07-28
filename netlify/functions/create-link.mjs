import { getStore } from "@netlify/blobs";
import { Jimp } from "jimp";

export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let formData;
  try {
    formData = await req.formData();
  } catch {
    return json({ error: "Format form tidak valid" }, 400);
  }

  const password = (formData.get("password") || "").toString();
  const adminPassword = Netlify.env.get("ADMIN_PASSWORD");

  if (!adminPassword) {
    return json(
      { error: "ADMIN_PASSWORD belum di-set di Netlify environment variables" },
      500
    );
  }

  if (password !== adminPassword) {
    return json({ error: "Password salah" }, 401);
  }

  const targetLink = (formData.get("targetLink") || "").toString().trim();
  const rawSlug = (formData.get("slug") || "").toString().trim();
  const imageFile = formData.get("image");

  if (!targetLink || !rawSlug || !imageFile || typeof imageFile === "string") {
    return json({ error: "Link, slug, dan gambar wajib diisi" }, 400);
  }

  if (!/^https?:\/\//i.test(targetLink)) {
    return json({ error: "Target link harus diawali http:// atau https://" }, 400);
  }

  const slug = rawSlug
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) {
    return json({ error: "Slug tidak valid, gunakan huruf/angka/tanda strip" }, 400);
  }

  if (imageFile.size > 2 * 1024 * 1024) {
    return json({ error: "Gambar maksimal 2MB" }, 400);
  }

  const linksStore = getStore("links");
  const imagesStore = getStore("images");

  const existing = await linksStore.get(slug);
  if (existing) {
    return json({ error: `Slug "${slug}" sudah dipakai, coba slug lain` }, 409);
  }

  const originalBuffer = Buffer.from(await imageFile.arrayBuffer());

  let processedBuffer;
  try {
    const image = await Jimp.read(originalBuffer);
    image.cover({ w: 1080, h: 1080 });
    processedBuffer = await image.getBuffer("image/jpeg");
  } catch (err) {
    return json({ error: "Gagal memproses gambar, coba file gambar lain" }, 400);
  }

  const contentType = "image/jpeg";

  await imagesStore.set(slug, processedBuffer, { metadata: { contentType } });

  await linksStore.setJSON(slug, {
    targetLink,
    slug,
    contentType,
    createdAt: new Date().toISOString(),
  });

  const origin = new URL(req.url).origin;
  const generatedLink = `${origin}/tools-linkmasking/${slug}`;

  return json({ success: true, link: generatedLink, slug });
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
