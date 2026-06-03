"use client";

import { useEffect, useId, useRef, useState } from "react";
import imageCompression from "browser-image-compression";

const SUPPORTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const COMPRESSION_MARKS = [
  { value: 15, label: "Light" },
  { value: 30, label: "Balanced" },
  { value: 45, label: "Strong" },
];

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function calculateSaving(original, compressed) {
  if (!original || !compressed || compressed >= original) return 0;
  return Math.round(((original - compressed) / original) * 100);
}

function createDownloadName(fileName) {
  const extensionIndex = fileName.lastIndexOf(".");

  if (extensionIndex === -1) {
    return `${fileName}-compressed`;
  }

  const name = fileName.slice(0, extensionIndex);
  const extension = fileName.slice(extensionIndex);
  return `${name}-compressed${extension}`;
}

function createSummaryError(invalidTypeCount, oversizeCount) {
  const messages = [];

  if (invalidTypeCount > 0) {
    messages.push(
      `${invalidTypeCount} file${invalidTypeCount > 1 ? "s were" : " was"} skipped because only JPG, PNG, and WebP are supported.`
    );
  }

  if (oversizeCount > 0) {
    messages.push(
      `${oversizeCount} file${oversizeCount > 1 ? "s were" : " was"} skipped because the size limit is 20 MB per image.`
    );
  }

  return messages.join(" ");
}

function revokeItemUrls(item, includeOriginal = true) {
  if (includeOriginal && item.originalUrl) {
    URL.revokeObjectURL(item.originalUrl);
  }

  if (item.compressedUrl) {
    URL.revokeObjectURL(item.compressedUrl);
  }
}

function downloadFile(file) {
  const link = document.createElement("a");
  const downloadUrl = URL.createObjectURL(file);
  link.href = downloadUrl;
  link.download = createDownloadName(file.name);
  link.click();
  URL.revokeObjectURL(downloadUrl);
}

export default function ImageUploader() {
  const inputId = useId();
  const nextIdRef = useRef(0);
  const itemsRef = useRef([]);
  const zoomImageRef = useRef(null);
  const [items, setItems] = useState([]);
  const [compression, setCompression] = useState(30);
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
      itemsRef.current.forEach((item) => revokeItemUrls(item));

      if (zoomImageRef.current?.src) {
        URL.revokeObjectURL(zoomImageRef.current.src);
      }
    };
  }, []);

  function closeZoom() {
    if (zoomImage?.src) {
      URL.revokeObjectURL(zoomImage.src);
    }

    setZoomImage(null);
  }

  function openZoom(imageFile, label) {
    if (!imageFile) return;

    if (zoomImage?.src) {
      URL.revokeObjectURL(zoomImage.src);
    }

    setZoomImage({
      src: URL.createObjectURL(imageFile),
      label,
    });
  }

  function replaceItems(nextItems) {
    setItems((currentItems) => {
      currentItems.forEach((item) => revokeItemUrls(item));
      return nextItems;
    });
  }

  function handleSelectedFiles(selectedFiles) {
    if (!selectedFiles.length) return;

    let invalidTypeCount = 0;
    let oversizeCount = 0;

    const validItems = selectedFiles.reduce((accumulator, selectedFile) => {
      if (!SUPPORTED_FILE_TYPES.includes(selectedFile.type)) {
        invalidTypeCount += 1;
        return accumulator;
      }

      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        oversizeCount += 1;
        return accumulator;
      }

      accumulator.push({
        id: nextIdRef.current++,
        file: selectedFile,
        originalUrl: URL.createObjectURL(selectedFile),
        compressedFile: null,
        compressedUrl: "",
        error: "",
      });

      return accumulator;
    }, []);

    closeZoom();
    replaceItems(validItems);
    setErrorMessage(createSummaryError(invalidTypeCount, oversizeCount));
  }

  function handleImageUpload(event) {
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

  async function compressImages() {
    if (!items.length) return;

    setLoading(true);
    setErrorMessage("");
    closeZoom();

    const results = await Promise.all(
      items.map(async (item) => {
        const reductionPercent = Math.min(compression * 1.8, 92);
        const targetSizeBytes = Math.max(item.file.size * (1 - reductionPercent / 100), 120 * 1024);
        const targetSizeMB = targetSizeBytes / (1024 * 1024);
        const quality = Math.max(0.1, 1 - reductionPercent / 100);

        try {
          const result = await imageCompression(item.file, {
            maxSizeMB: targetSizeMB,
            maxWidthOrHeight: 2200,
            useWebWorker: true,
            initialQuality: quality,
          });

          return {
            ...item,
            compressedFile: result,
            compressedUrl: URL.createObjectURL(result),
            error: "",
          };
        } catch (error) {
          console.error(`Compression error for ${item.file.name}:`, error);

          return {
            ...item,
            compressedFile: null,
            compressedUrl: "",
            error: "Compression failed for this image. Try a lighter setting.",
          };
        }
      })
    );

    setItems((currentItems) => {
      currentItems.forEach((item) => {
        if (item.compressedUrl) {
          URL.revokeObjectURL(item.compressedUrl);
        }
      });

      return results;
    });

    if (results.some((item) => item.error)) {
      setErrorMessage("Some images could not be compressed. You can still download the successful results.");
    }

    setLoading(false);
  }

  function downloadCompressedImage(item) {
    if (!item.compressedFile) return;
    downloadFile(item.compressedFile);
  }

  function downloadAllCompressedImages() {
    const compressedItems = items.filter((item) => item.compressedFile);

    compressedItems.forEach((item, index) => {
      window.setTimeout(() => {
        downloadFile(item.compressedFile);
      }, index * 150);
    });
  }

  const originalSize = items.reduce((total, item) => total + item.file.size, 0);
  const compressedSize = items.reduce((total, item) => total + (item.compressedFile?.size ?? 0), 0);
  const savedPercentage = calculateSaving(originalSize, compressedSize);
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const compressedCount = items.filter((item) => item.compressedFile).length;

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
                ? "border-amber-500 bg-amber-50"
                : "border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.96))] hover:border-slate-500 hover:bg-slate-50"
            }`}
          >
            <input
              id={inputId}
              type="file"
              accept={SUPPORTED_FILE_TYPES.join(",")}
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="mb-5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm">
              Drag, drop, compress
            </div>

            <h2 className="max-w-lg text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Upload multiple images and shrink file size together without leaving the browser
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Fast client-side compression for JPG, PNG, and WebP. Select a batch, compress everything in one go, and download each optimized image locally.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">Private processing</span>
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

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-5 shadow-sm">
            <p className="text-sm text-slate-500">Original total</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatFileSize(originalSize)}</p>
            <p className="mt-1 text-xs text-slate-500">{items.length} image{items.length === 1 ? "" : "s"}</p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-5 shadow-sm">
            <p className="text-sm text-slate-500">Compressed total</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatFileSize(compressedSize)}</p>
            <p className="mt-1 text-xs text-slate-500">{compressedCount} ready to download</p>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-200/80 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm text-emerald-700">Space saved</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-950">{savedPercentage}%</p>
            <p className="mt-1 text-xs text-emerald-800">{formatFileSize(savedBytes)} smaller</p>
          </div>
        </div>

        {items.length ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Image batch</h3>
                <p className="text-sm text-slate-500">
                  Preview each original and compressed result side by side.
                </p>
              </div>

              {compressedCount ? (
                <button
                  type="button"
                  onClick={downloadAllCompressedImages}
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Download all compressed images
                </button>
              ) : null}
            </div>

            <div className="grid gap-6">
              {items.map((item) => {
                const itemCompressedSize = item.compressedFile?.size ?? 0;
                const itemSavedPercentage = calculateSaving(item.file.size, itemCompressedSize);

                return (
                  <article
                    key={item.id}
                    className="rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur"
                  >
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-950">{item.file.name}</h4>
                        <p className="text-sm text-slate-500">
                          {formatFileSize(item.file.size)}
                          {item.compressedFile ? ` -> ${formatFileSize(itemCompressedSize)}` : " -> waiting for compression"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.compressedFile
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.compressedFile ? `${itemSavedPercentage}% saved` : "Pending"}
                      </span>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">Original</p>
                        <button
                          type="button"
                          onClick={() => openZoom(item.file, `Original preview for ${item.file.name}`)}
                          className="block h-64 w-full overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={item.originalUrl}
                            alt={`Original preview for ${item.file.name}`}
                            className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                          />
                        </button>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">Compressed</p>
                        <div className="flex h-64 items-center justify-center overflow-hidden rounded-[1.25rem] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.12),transparent_42%),linear-gradient(180deg,#f8fafc,#e2e8f0)]">
                          {item.compressedUrl ? (
                            <button
                              type="button"
                              onClick={() => openZoom(item.compressedFile, `Compressed preview for ${item.file.name}`)}
                              className="block h-full w-full"
                            >
                              <img
                                src={item.compressedUrl}
                                alt={`Compressed preview for ${item.file.name}`}
                                className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                              />
                            </button>
                          ) : (
                            <p className="max-w-xs text-center text-sm leading-6 text-slate-500">
                              {item.error || "Compressed preview will appear here after the batch run."}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {item.compressedFile ? (
                      <button
                        type="button"
                        onClick={() => downloadCompressedImage(item)}
                        className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        Download compressed image
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <aside className="rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,251,235,0.92),rgba(255,255,255,0.98))] p-6 shadow-[0_20px_70px_rgba(148,163,184,0.18)]">
        <div className="rounded-[1.5rem] border border-white/80 bg-white/70 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">Compression control</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Choose how aggressive the file reduction should be
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Lower settings preserve more detail. Higher settings target stronger size reduction for web uploads, messaging, and lightweight pages.
          </p>

          <div className="mt-6 flex items-center justify-between rounded-[1.25rem] bg-slate-950 px-4 py-3 text-white">
            <span className="text-sm text-slate-300">Current level</span>
            <span className="text-xl font-semibold">{compression}%</span>
          </div>

          <input
            type="range"
            min="5"
            max="50"
            step="1"
            value={compression}
            onChange={(event) => setCompression(Number(event.target.value))}
            className="mt-6 w-full cursor-pointer accent-amber-500"
            aria-label="Compression strength"
          />

          <div className="mt-4 grid grid-cols-3 gap-2">
            {COMPRESSION_MARKS.map((mark) => (
              <button
                key={mark.value}
                type="button"
                onClick={() => setCompression(mark.value)}
                className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
                  compression === mark.value
                    ? "border-slate-900 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                <span className="block font-medium">{mark.label}</span>
                <span className="mt-1 block text-xs opacity-80">{mark.value}%</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={compressImages}
            disabled={!items.length || loading}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-amber-500 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? "Compressing images..." : "Compress all images"}
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-[1.25rem] border border-slate-200/70 bg-white/75 p-4">
            <p className="text-sm font-semibold text-slate-900">Why this feels faster</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Images are compressed directly in the browser, which avoids server round-trips and helps keep user files private.
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200/70 bg-white/75 p-4">
            <p className="text-sm font-semibold text-slate-900">Best use cases</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Blog image batches, ecommerce product photos, portfolio uploads, social sharing assets, and faster website media delivery.
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
