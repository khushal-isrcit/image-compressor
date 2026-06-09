"use client";

import { useEffect, useId, useRef, useState } from "react";

const SUPPORTED_FILE_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;

const QUALITY_PRESETS = [
  { value: "light", label: "Light", crf: 23, description: "High quality, moderate size reduction" },
  { value: "balanced", label: "Balanced", crf: 28, description: "Good balance of quality and size" },
  { value: "strong", label: "Strong", crf: 33, description: "Smaller file, some quality loss" },
];

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function calculateSaving(original, compressed) {
  if (!original || !compressed || compressed >= original) return 0;
  return Math.round(((original - compressed) / original) * 100);
}

function createDownloadName(fileName) {
  const extensionIndex = fileName.lastIndexOf(".");
  if (extensionIndex === -1) return `${fileName}-compressed.mp4`;
  return `${fileName.slice(0, extensionIndex)}-compressed.mp4`;
}

export default function VideoCompressor() {
  const inputId = useId();
  const ffmpegRef = useRef(null);
  const [video, setVideo] = useState(null);
  const [quality, setQuality] = useState("balanced");
  const [loading, setLoading] = useState(false);
  const [engineLoading, setEngineLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    return () => {
      if (video?.originalUrl) URL.revokeObjectURL(video.originalUrl);
      if (video?.compressedUrl) URL.revokeObjectURL(video.compressedUrl);
    };
  }, []);

  async function getFFmpeg() {
    if (ffmpegRef.current) return ffmpegRef.current;

    setEngineLoading(true);
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");

    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegRef.current = ffmpeg;
    setEngineLoading(false);
    return ffmpeg;
  }

  function handleSelectedFile(file) {
    if (!file) return;

    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      setErrorMessage("Unsupported format. Please upload an MP4, WebM, or MOV video.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("File too large. The size limit is 200 MB per video.");
      return;
    }

    if (video?.originalUrl) URL.revokeObjectURL(video.originalUrl);
    if (video?.compressedUrl) URL.revokeObjectURL(video.compressedUrl);

    setVideo({
      file,
      originalUrl: URL.createObjectURL(file),
      compressedFile: null,
      compressedUrl: "",
      error: "",
    });
    setErrorMessage("");
    setProgress(0);
  }

  function handleFileInput(event) {
    handleSelectedFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleSelectedFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function compressVideo() {
    if (!video) return;

    setLoading(true);
    setErrorMessage("");
    setProgress(0);

    try {
      const ffmpeg = await getFFmpeg();
      const { fetchFile } = await import("@ffmpeg/util");

      const preset = QUALITY_PRESETS.find((p) => p.value === quality);
      const crf = preset?.crf ?? 28;

      const handleProgress = ({ progress: p }) => setProgress(Math.round(p * 100));
      ffmpeg.on("progress", handleProgress);

      await ffmpeg.writeFile("input.mp4", await fetchFile(video.file));
      await ffmpeg.exec([
        "-i", "input.mp4",
        "-c:v", "libx264",
        "-crf", String(crf),
        "-preset", "fast",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "output.mp4",
      ]);

      const data = await ffmpeg.readFile("output.mp4");
      const blob = new Blob([data], { type: "video/mp4" });
      const compressedFile = new File([blob], createDownloadName(video.file.name), { type: "video/mp4" });

      ffmpeg.off("progress", handleProgress);
      await ffmpeg.deleteFile("input.mp4").catch(() => {});
      await ffmpeg.deleteFile("output.mp4").catch(() => {});

      if (video.compressedUrl) URL.revokeObjectURL(video.compressedUrl);

      setVideo((prev) => ({
        ...prev,
        compressedFile,
        compressedUrl: URL.createObjectURL(blob),
        error: "",
      }));
      setProgress(100);
    } catch (err) {
      console.error("Video compression error:", err);
      setVideo((prev) => ({
        ...prev,
        compressedFile: null,
        compressedUrl: "",
        error: "Compression failed. Try a lower quality setting or a smaller file.",
      }));
      setErrorMessage("Compression failed. Try a different quality setting or a smaller file.");
      setEngineLoading(false);
    }

    setLoading(false);
  }

  function downloadCompressedVideo() {
    if (!video?.compressedFile) return;
    const link = document.createElement("a");
    link.href = video.compressedUrl;
    link.download = video.compressedFile.name;
    link.click();
  }

  const savedPercentage = calculateSaving(video?.file.size, video?.compressedFile?.size);
  const savedBytes = Math.max(0, (video?.file.size ?? 0) - (video?.compressedFile?.size ?? 0));

  return (
    <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <div className="rounded-4xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <label
            htmlFor={inputId}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-10 text-center transition duration-300 ${
              isDragging
                ? "border-sky-500 bg-sky-50"
                : "border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.96))] hover:border-slate-500 hover:bg-slate-50"
            }`}
          >
            <input
              id={inputId}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="mb-5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm">
              Drag, drop, compress
            </div>

            <h2 className="max-w-lg text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Upload a video and reduce its file size directly in the browser
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Client-side compression for MP4, WebM, and MOV. No upload to servers — everything stays on your device.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">Private processing</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Up to 200 MB</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">H.264 MP4 output</span>
            </div>
          </label>

          {errorMessage ? (
            <p
              className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              aria-live="polite"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-5 shadow-sm">
            <p className="text-sm text-slate-500">Original size</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatFileSize(video?.file.size ?? 0)}</p>
            <p className="mt-1 text-xs text-slate-500 truncate">{video ? video.file.name : "No file selected"}</p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-5 shadow-sm">
            <p className="text-sm text-slate-500">Compressed size</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatFileSize(video?.compressedFile?.size ?? 0)}</p>
            <p className="mt-1 text-xs text-slate-500">{video?.compressedFile ? "Ready to download" : "Waiting for compression"}</p>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-200/80 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm text-emerald-700">Space saved</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-950">{savedPercentage}%</p>
            <p className="mt-1 text-xs text-emerald-800">{formatFileSize(savedBytes)} smaller</p>
          </div>
        </div>

        {video ? (
          <div className="space-y-4">
            <article className="rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-950">{video.file.name}</h4>
                  <p className="text-sm text-slate-500">
                    {formatFileSize(video.file.size)}
                    {video.compressedFile
                      ? ` → ${formatFileSize(video.compressedFile.size)}`
                      : " → waiting for compression"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    video.compressedFile
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {video.compressedFile ? `${savedPercentage}% saved` : "Pending"}
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Original</p>
                  <video
                    src={video.originalUrl}
                    controls
                    className="h-64 w-full rounded-[1.25rem] border border-slate-200 bg-slate-950 object-contain"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Compressed</p>
                  <div className="flex h-64 items-center justify-center overflow-hidden rounded-[1.25rem] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_42%),linear-gradient(180deg,#f8fafc,#e2e8f0)]">
                    {video.compressedUrl ? (
                      <video
                        src={video.compressedUrl}
                        controls
                        className="h-full w-full rounded-[1.25rem] bg-slate-950 object-contain"
                      />
                    ) : loading ? (
                      <div className="flex flex-col items-center gap-3 px-6 text-center">
                        <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-sky-500 transition-all duration-300"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <p className="text-sm text-slate-500">
                          {engineLoading ? "Loading engine..." : `${progress}% compressed`}
                        </p>
                      </div>
                    ) : (
                      <p className="max-w-xs text-center text-sm leading-6 text-slate-500">
                        {video.error || "Compressed preview will appear here after compression."}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {video.compressedFile ? (
                <button
                  type="button"
                  onClick={downloadCompressedVideo}
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Download compressed video
                </button>
              ) : null}
            </article>
          </div>
        ) : null}
      </div>

      <aside className="rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(224,242,254,0.92),rgba(255,255,255,0.98))] p-6 shadow-[0_20px_70px_rgba(148,163,184,0.18)]">
        <div className="rounded-[1.5rem] border border-white/80 bg-white/70 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">Quality control</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Choose the output quality for the compressed video
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Lower quality means smaller files. Higher quality preserves more detail at the cost of file size.
          </p>

          <div className="mt-6 grid gap-2">
            {QUALITY_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setQuality(preset.value)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  quality === preset.value
                    ? "border-slate-900 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                <span className="block font-medium">{preset.label}</span>
                <span className="mt-1 block text-xs opacity-70">{preset.description}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={compressVideo}
            disabled={!video || loading}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading
              ? engineLoading
                ? "Loading engine..."
                : `Compressing... ${progress}%`
              : "Compress video"}
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-[1.25rem] border border-slate-200/70 bg-white/75 p-4">
            <p className="text-sm font-semibold text-slate-900">First run takes a moment</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              The compression engine (~31 MB) loads once from a CDN on first use, then stays cached in your browser for future sessions.
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200/70 bg-white/75 p-4">
            <p className="text-sm font-semibold text-slate-900">Output format</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              All videos are exported as H.264 MP4, compatible with most devices, players, and upload platforms.
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}
