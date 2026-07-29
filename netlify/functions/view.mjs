import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const slug = context.params.slug;
  const linksStore = getStore("links");
  const data = await linksStore.get(slug, { type: "json" });

  if (!data) {
    return new Response(notFoundHtml(), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const origin = new URL(req.url).origin;
  const imageUrl = `${origin}/img/${data.slug}`;
  const pageUrl = `${origin}/tools-linkmasking/${data.slug}`;

  // Bots (Facebook, WhatsApp, Twitter, dll) hanya baca meta tag, gak jalanin JS.
  // Kalau ketauan bot, JANGAN kasih redirect apapun (no meta-refresh, no script)
  // supaya bot cuma nampilin og:image kita, bukan lanjut ke target link.
  const userAgent = req.headers.get("user-agent") || "";
  const isCrawler = /facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|pinterest|google.*snippet/i.test(
    userAgent
  );

  const redirectPart = isCrawler
    ? ""
    : `<script>window.location.replace(${JSON.stringify(data.targetLink)});</script>`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta property="og:title" content="Cek promo terbaru!" />
<meta property="og:description" content="Klik gambar untuk lihat produknya" />
<meta property="og:image" content="${escapeAttr(imageUrl)}" />
<meta property="og:image:width" content="1080" />
<meta property="og:image:height" content="1080" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${escapeAttr(pageUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<title>Mengalihkan...</title>
</head>
<body style="font-family:sans-serif;text-align:center;padding-top:40px;">
<p>Mengalihkan, mohon tunggu...</p>
<p><a href="${escapeAttr(data.targetLink)}">Klik di sini jika tidak otomatis</a></p>
${redirectPart}
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
};

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}

function notFoundHtml() {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding-top:40px;"><p>Link tidak ditemukan.</p></body></html>`;
}

export const config = {
  path: "/tools-linkmasking/:slug",
};
