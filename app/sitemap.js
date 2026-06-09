export default function sitemap() {
  return [
    {
      url: "https://image-compressor-tool.vercel.app",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://image-compressor-tool.vercel.app/convert",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://image-compressor-tool.vercel.app/video",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
