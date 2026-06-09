"use client";

import { useEffect, useId, useRef, useState } from "react";

const SUPPORTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const FORMAT_OPTIONS = [
  { value: "image/jpeg", label: "JPEG", ext: ".jpg" },
  { value: "image/png", label: "PNG", ext: ".png" },
  { value: "image/webp", label: "WebP", ext: ".webp" },
];

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function createConvertedName(fileName, ext) {
  const extensionIndex = fileName.lastIndexOf(".");
  const name = extensionIndex === -1 ? fileName : fileName.slice(0, extensionIndex);
  return `${name}-converted${ext}`;
}

function revokeItemUrls(item) {
  if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
  if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
}

function convertImageToFormat(file, outputMime) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");

      // JPEG doesn't support transparency — fill white background
      if (outputMime === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        outputMime,
        1.0
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

export default function ImageConverter() {
  const inputId = useId();
  const nextIdRef = useRef(0);
  const itemsRef = useRef([]);
  const zoomImageRef = useRef(null);
  const [items, setItems] = useState([]);
  const [outputFormat, setOutputFormat] = useState("image/webp");
  const [loading, setLoading] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    zoomImageRef.current = zoomImage;
  }, [zoomImage]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach(revokeItemUrls);
      if (zoomImageRef.current?.src) URL.revokeObjectURL(zoomImageRef.current.src);
    };
  }, []);

  function closeZoom() {
    if (zoomImage?.src) URL.revokeObjectURL(zoomImage.src);
    setZoomImage(null);
  }

  function openZoom(imageFile, label) {
    if (!imageFile) return;
    if (zoomImage?.src) URL.revokeObjectURL(zoomImage.src);
    setZoomImage({ src: URL.createObjectURL(imageFile), label });
  }

  function replaceItems(nextItems) {
    setItems((currentItems) => {
      currentItems.forEach(revokeItemUrls);
      return nextItems;
    });
  }

  function handleSelectedFiles(selectedFiles) {
    if (!selectedFiles.length) return;

    let invalidTypeCount = 0;
    let oversizeCount = 0;

    const validItems = selectedFiles.reduce((acc, file) => {
      if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
        invalidTypeCount += 1;
        return acc;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        oversizeCount += 1;
        return acc;
      }
      acc.push({
        id: nextIdRef.current++,
        file,
        originalUrl: URL.createObjectURL(file),
        convertedFile: null,
        convertedUrl: "",
        error: "",
      });
      return acc;
    }, []);

    const messages = [];
    if (invalidTypeCount > 0) {
      messages.push(`${invalidTypeCount} file${invalidTypeCount > 1 ? "s were" : " was"} skipped — only JPG, PNG, and WebP are supported.`);
    }
    if (oversizeCount > 0) {
      messages.push(`${oversizeCount} file${oversizeCount > 1 ? "s were" : " was"} skipped — size limit is 20 MB per image.`);
    }

    closeZoom();
    replaceItems(validItems);
    setErrorMessage(messages.join(" "));
  }

  function handleFileInput(event) {
    handleSelectedFiles(Array.from(event.target.files ?? []));
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
    handleSelectedFiles(Array.from(event.dataTransfer.files ?? []));
  }

  async function convertImages() {
    if (!items.length) return;

    setLoading(true);
    setErrorMessage("");
    closeZoom();

    const ext = FORMAT_OPTIONS.find((f) => f.value === outputFormat)?.ext ?? "";

    const results = await Promise.all(
      items.map(async (item) => {
        if (item.file.type === outputFormat) {
          return {
            ...item,
            convertedFile: null,
            convertedUrl: "",
            error: `Already ${outputFormat.split("/")[1].toUpperCase()} — pick a different format.`,
          };
        }

        try {
          const blob = await convertImageToFormat(item.file, outputFormat);
          const name = createConvertedName(item.file.name, ext);
          const convertedFile = new File([blob], name, { type: outputFormat });

          return {
            ...item,
            convertedFile,
            convertedUrl: URL.createObjectURL(convertedFile),
            error: "",
          };
        } catch (error) {
          console.error(`Conversion error for ${item.file.name}:`, error);
          return {
            ...item,
            convertedFile: null,
            convertedUrl: "",
            error: "Conversion failed for this image.",
          };
        }
      })
    );

    setItems((currentItems) => {
      currentItems.forEach((item) => {
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      });
      return results;
    });

    if (results.some((item) => item.error)) {
      setErrorMessage("Some images could not be converted.");
    }

    setLoading(false);
  }

  function downloadConverted(item) {
    if (!item.convertedFile) return;
    const link = document.createElement("a");
    link.href = item.convertedUrl;
    link.download = item.convertedFile.name;
    link.click();
  }

  function downloadAll() {
    items
      .filter((item) => item.convertedFile)
      .forEach((item, index) => {
        window.setTimeout(() => downloadConverted(item), index * 150);
      });
  }

  const convertedCount = items.filter((item) => item.convertedFile).length;

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
                ? "border-violet-500 bg-violet-50"
                : "border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.96))] hover:border-slate-500 hover:bg-slate-50"
            }`}
          >
            <input
              id={inputId}
              type="file"
              accept={SUPPORTED_FILE_TYPES.join(",")}
              multiple
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="mb-5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm">
              Drag, drop, convert
            </div>

            <h2 className="max-w-lg text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Convert JPG, PNG, and WebP images to a different format in the browser
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Full-quality format conversion — no compression applied. Pick your output format, convert the batch, and download.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">No quality loss</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Up to 20 MB each</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Batch friendly</span>
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

        {items.length ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Image batch</h3>
                <p className="text-sm text-slate-500">Preview each original and converted result side by side.</p>
              </div>

              {convertedCount ? (
                <button
                  type="button"
                  onClick={downloadAll}
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Download all converted images
                </button>
              ) : null}
            </div>

            <div className="grid gap-6">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-950">{item.file.name}</h4>
                      <p className="text-sm text-slate-500">
                        {item.file.type.split("/")[1].toUpperCase()}
                        {item.convertedFile
                          ? ` → ${outputFormat.split("/")[1].toUpperCase()}`
                          : " → waiting for conversion"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.convertedFile
                          ? "bg-violet-100 text-violet-800"
                          : item.error
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.convertedFile ? "Converted" : item.error ? "Skipped" : "Pending"}
                    </span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-700">Original</p>
                      <button
                        type="button"
                        onClick={() => openZoom(item.file, `Original — ${item.file.name}`)}
                        className="block h-64 w-full overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={item.originalUrl}
                          alt={`Original — ${item.file.name}`}
                          className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                        />
                      </button>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium text-slate-700">Converted</p>
                      <div className="flex h-64 items-center justify-center overflow-hidden rounded-[1.25rem] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.1),transparent_42%),linear-gradient(180deg,#f8fafc,#e2e8f0)]">
                        {item.convertedUrl ? (
                          <button
                            type="button"
                            onClick={() => openZoom(item.convertedFile, `Converted — ${item.convertedFile.name}`)}
                            className="block h-full w-full"
                          >
                            <img
                              src={item.convertedUrl}
                              alt={`Converted — ${item.convertedFile.name}`}
                              className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                            />
                          </button>
                        ) : (
                          <p className="max-w-xs text-center text-sm leading-6 text-slate-500">
                            {item.error || "Converted preview will appear here after the batch run."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.convertedFile ? (
                    <button
                      type="button"
                      onClick={() => downloadConverted(item)}
                      className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Download converted image
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <aside className="rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(245,243,255,0.92),rgba(255,255,255,0.98))] p-6 shadow-[0_20px_70px_rgba(148,163,184,0.18)]">
        <div className="rounded-[1.5rem] border border-white/80 bg-white/70 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-700">Format control</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Choose the output format for all images in the batch
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Images are re-encoded at full quality — only the format changes, not the resolution or visual detail.
          </p>

          <div className="mt-6 grid gap-2">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOutputFormat(opt.value)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  outputFormat === opt.value
                    ? "border-slate-900 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                <span className="block font-medium">{opt.label}</span>
                <span className="mt-1 block text-xs opacity-70">{opt.ext}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={convertImages}
            disabled={!items.length || loading}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? "Converting images..." : "Convert all images"}
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-[1.25rem] border border-slate-200/70 bg-white/75 p-4">
            <p className="text-sm font-semibold text-slate-900">No quality loss</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Conversion uses the browser Canvas API at maximum quality — only the container format changes.
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200/70 bg-white/75 p-4">
            <p className="text-sm font-semibold text-slate-900">JPEG and transparency</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              JPEG does not support transparent pixels. Transparent areas in PNG or WebP images will be filled with white when converting to JPEG.
            </p>
          </div>
        </div>
      </aside>

      {zoomImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-5 backdrop-blur-sm"
          onClick={closeZoom}
        >
          <button
            type="button"
            onClick={closeZoom}
            className="absolute right-5 top-5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white"
          >
            Close
          </button>

          <img
            src={zoomImage.src}
            alt={zoomImage.label}
            className="max-h-[90vh] max-w-[90vw] rounded-[1.5rem] object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </section>
  );
}
