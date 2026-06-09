import ToolNav from "../../components/ToolNav";
import VideoCompressor from "../../components/VideoCompressor";

export const metadata = {
  title: "Video Compressor",
  description:
    "Compress MP4, WebM, and MOV videos directly in the browser — reduce file size with H.264 encoding, no upload to any server.",
  keywords: [
    "video compressor",
    "compress video online",
    "reduce video file size",
    "mp4 compressor",
    "browser video compression",
    "h264 video encoder",
    "video optimizer",
  ],
  openGraph: {
    title: "Video Compressor",
    description:
      "Compress MP4, WebM, and MOV videos in the browser — H.264 output, completely private.",
    type: "website",
    siteName: "Image Compressor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Video Compressor",
    description:
      "Reduce video file size in the browser — H.264 encoding, no server upload.",
  },
};

const faqItems = [
  {
    question: "How does browser-based video compression work?",
    answer:
      "The tool uses FFmpeg compiled to WebAssembly, which runs the same encoding pipeline as desktop software — entirely inside your browser tab with no server involved.",
  },
  {
    question: "What video formats are supported?",
    answer:
      "You can upload MP4, WebM, and MOV files. All compressed videos are exported as H.264 MP4, which is compatible with virtually every device, player, and platform.",
  },
  {
    question: "Why does the first compression take longer?",
    answer:
      "The FFmpeg engine (~31 MB) is downloaded from a CDN on first use. After that it is cached by the browser, so subsequent compressions start immediately.",
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

export default function VideoPage() {
  return (
    <main className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_24%),linear-gradient(180deg,#f8fcff_0%,#f8fafc_46%,#eef2ff_100%)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-12 sm:px-8 lg:px-10 lg:pb-24 lg:pt-20">
        <div className="relative">
          <div className="absolute inset-x-16 top-0 -z-10 h-64 rounded-full bg-sky-200/30 blur-3xl" />
          <header className="max-w-3xl">
            <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-800">
              Private browser-based tool
            </div>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Compress videos in the browser without uploading to a server
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Reduce MP4, WebM, and MOV file sizes using FFmpeg WebAssembly — H.264 output, fully private, no account required.
            </p>
          </header>
        </div>

        <div className="mt-12">
          <ToolNav />
          <VideoCompressor />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-18 sm:px-8 lg:grid-cols-3 lg:px-10">
        <article className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Engine</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">FFmpeg in the browser</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The same encoding library used by desktop video tools runs as WebAssembly — giving you real compression without a server.
          </p>
        </article>

        <article className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Privacy</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Nothing leaves your device</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your video never leaves the browser tab — compression happens locally so personal or client footage stays private.
          </p>
        </article>

        <article className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Output</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Universal H.264 MP4</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Every compressed video is exported as H.264 MP4 — the format accepted by virtually every device, platform, and video player.
          </p>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-10">
        <div className="rounded-[2.25rem] border border-slate-200/70 bg-white/75 p-8 shadow-[0_25px_90px_rgba(148,163,184,0.18)] backdrop-blur sm:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Video compression FAQ</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Common questions about browser-based video compression
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
