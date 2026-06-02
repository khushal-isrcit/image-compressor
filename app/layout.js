import { Geist_Mono, Manrope } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://image-compressor-tool.vercel.app"),
  title: {
    default: "Image Compressor | Free Browser-Based JPG, PNG, and WebP Optimizer",
    template: "%s | Image Compressor",
  },
  description:
    "Compress JPG, PNG, and WebP images directly in your browser to improve website performance, page speed, and upload experience.",
  keywords: [
    "image compressor",
    "compress images online",
    "jpg compressor",
    "png compressor",
    "webp optimizer",
    "image optimization tool",
    "reduce image size",
    "website performance",
  ],
  applicationName: "Image Compressor",
  category: "technology",
  openGraph: {
    title: "Image Compressor",
    description:
      "Reduce image file size in the browser for faster websites, quicker uploads, and stronger page performance.",
    type: "website",
    siteName: "Image Compressor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Compressor",
    description:
      "Compress JPG, PNG, and WebP images in your browser for faster, lighter web experiences.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
