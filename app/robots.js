export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://image-compressor-tool.vercel.app/sitemap.xml",
  };
}
