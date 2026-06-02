import Header from "../components/Header";
import ImageUploader from "../components/ImageUploader";

const faqItems = [
  {
    question: "How does this image compressor improve website performance?",
    answer:
      "Smaller images reduce page weight, which helps pages load faster, improves Core Web Vitals, and creates a smoother browsing experience on mobile and desktop.",
  },
  {
    question: "Are my images uploaded to a server?",
    answer:
      "No. Compression runs inside the browser, which keeps the process fast and more private for users working with personal or client media.",
  },
  {
    question: "Which file formats are supported?",
    answer:
      "The tool currently supports JPG, PNG, and WebP images, which cover the most common formats used across websites, blogs, stores, and portfolios.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.24),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_24%),linear-gradient(180deg,#fffdf8_0%,#f8fafc_46%,#eef2ff_100%)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-12 sm:px-8 lg:px-10 lg:pb-24 lg:pt-20">
        <div className="relative">
          <div className="absolute inset-x-16 top-0 -z-10 h-64 rounded-full bg-amber-200/30 blur-3xl" />
          <Header />
        </div>

        <div className="mt-12">
          <ImageUploader />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-18 sm:px-8 lg:grid-cols-3 lg:px-10">
        <article className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Speed</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Built for page performance</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Lighter images help websites load faster and keep visitors engaged, especially on slower mobile networks.
          </p>
        </article>

        <article className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Privacy</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Local browser compression</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The image workflow stays on-device, so users can compress photos quickly without relying on a remote upload pipeline.
          </p>
        </article>

        <article className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">SEO</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Cleaner content structure</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Clear headings, semantic sections, and relevant page copy make the tool easier for search engines and people to understand.
          </p>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-10">
        <div className="rounded-[2.25rem] border border-slate-200/70 bg-white/75 p-8 shadow-[0_25px_90px_rgba(148,163,184,0.18)] backdrop-blur sm:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Image compression FAQ</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Common questions about image optimization and file size reduction
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
