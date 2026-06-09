import ToolNav from "../../components/ToolNav";
import ImageConverter from "../../components/ImageConverter";

export const metadata = {
  title: "Image Format Converter",
  description:
    "Convert JPG, PNG, and WebP images to a different format directly in the browser — full quality, no compression, no server upload.",
  keywords: [
    "image format converter",
    "convert jpg to png",
    "convert png to webp",
    "convert webp to jpg",
    "image conversion online",
    "browser image converter",
    "jpg png webp converter",
  ],
  openGraph: {
    title: "Image Format Converter",
    description:
      "Convert JPG, PNG, and WebP images in your browser — full quality, no server upload required.",
    type: "website",
    siteName: "Image Compressor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Format Converter",
    description:
      "Convert image formats in the browser — full quality, completely private.",
  },
};

const faqItems = [
  {
    question: "Does converting a format reduce image quality?",
    answer:
      "No. Conversion runs at maximum quality using the browser Canvas API — only the container format changes, not the resolution or visual detail.",
  },
  {
    question: "What happens to transparent areas when converting to JPEG?",
    answer:
      "JPEG does not support transparency. Any transparent pixels in a PNG or WebP image will be filled with a white background during conversion.",
  },
  {
    question: "Why convert to WebP?",
    answer:
      "WebP typically produces smaller files than JPEG or PNG at equivalent quality, making it a strong choice for web images and performance-focused projects.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function ConvertPage() {
  return (
    <main className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_24%),linear-gradient(180deg,#fdfcff_0%,#f8fafc_46%,#eef2ff_100%)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-12 sm:px-8 lg:px-10 lg:pb-24 lg:pt-20">
        <div className="relative">
          <div className="absolute inset-x-16 top-0 -z-10 h-64 rounded-full bg-violet-200/30 blur-3xl" />
          <header className="max-w-3xl">
            <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-violet-800">
              Private browser-based tool
            </div>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Convert image formats without losing quality
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Re-encode JPG, PNG, and WebP images to any supported format directly in the browser — full quality, no server upload, no file size trade-off.
            </p>
          </header>
        </div>

        <div className="mt-12">
          <ToolNav />
          <ImageConverter />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-18 sm:px-8 lg:grid-cols-3 lg:px-10">
        <article className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Quality</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">No quality loss</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The Canvas API re-encodes images at maximum quality — the only thing that changes is the file container format.
          </p>
        </article>

        <article className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Privacy</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Stays on your device</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Conversion happens entirely in the browser — no files are sent to any server at any point in the process.
          </p>
        </article>

        <article className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Compatibility</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Broad format support</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Convert between JPEG, PNG, and WebP — the three formats that cover virtually every use case across web, print, and social media.
          </p>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-10">
        <div className="rounded-[2.25rem] border border-slate-200/70 bg-white/75 p-8 shadow-[0_25px_90px_rgba(148,163,184,0.18)] backdrop-blur sm:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-700">Format conversion FAQ</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Common questions about image format conversion
            </h2>
          </div>

          <div className="mt-8 grid gap-4">
            {faqItems.map((item) => (
              <article
                key={item.question}
                className="rounded-[1.5rem] border border-slate-200/80 bg-white px-5 py-5 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-950">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
