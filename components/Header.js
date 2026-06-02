export default function Header() {
  return (
    <header className="max-w-3xl">
      <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">
        Private browser-based tool
      </div>

      <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
        Compress images faster with a cleaner, lighter workflow
      </h1>

      <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
        Reduce JPG, PNG, and WebP file sizes directly in the browser for better page speed, smoother uploads, and a sharper user experience across the web.
      </p>
    </header>
  );
}
