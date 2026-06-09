"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Image Compressor" },
  { href: "/convert", label: "Format Converter" },
  { href: "/video", label: "Video Compressor" },
];

export default function ToolNav() {
  const pathname = usePathname();

  return (
    <div className="mb-8 flex w-fit gap-2 rounded-full border border-slate-200/80 bg-white/80 p-1.5 shadow-sm backdrop-blur">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
            pathname === tab.href
              ? "bg-slate-950 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
