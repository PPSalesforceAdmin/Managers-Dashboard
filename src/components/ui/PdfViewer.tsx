"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface Props {
  src: string;
  title?: string;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 6;
const ZOOM_STEP = 1.25;

export function PdfViewer({ src, title }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [zoom, setZoom] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setContainerWidth(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const file = useMemo(() => ({ url: src }), [src]);

  const renderWidth = Math.max(200, Math.round(containerWidth * zoom));

  const zoomIn = () =>
    setZoom((z) => Math.min(parseFloat((z * ZOOM_STEP).toFixed(3)), MAX_ZOOM));
  const zoomOut = () =>
    setZoom((z) => Math.max(parseFloat((z / ZOOM_STEP).toFixed(3)), MIN_ZOOM));
  const zoomReset = () => setZoom(1);
  const fitWidth = () => setZoom(1);

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm">
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          className="rounded border border-slate-300 px-2 py-1 enabled:hover:bg-slate-100 disabled:opacity-40"
        >
          −
        </button>
        <span className="min-w-[4ch] text-center tabular-nums text-slate-600">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          className="rounded border border-slate-300 px-2 py-1 enabled:hover:bg-slate-100 disabled:opacity-40"
        >
          +
        </button>
        <button
          type="button"
          onClick={fitWidth}
          className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
        >
          Fit width
        </button>
        {numPages && numPages > 1 ? (
          <span className="ml-auto text-slate-500">{numPages} pages</span>
        ) : null}
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-auto rounded border border-slate-200 bg-white"
        style={{ height: "82vh" }}
      >
        {error ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-600">
            <div>
              <p className="font-medium">Couldn't render the PDF inline.</p>
              <p className="mt-1 text-slate-500">{error}</p>
              <a
                href={`${src}${src.includes("?") ? "&" : "?"}download=1`}
                className="mt-3 inline-block rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
              >
                Download instead
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center p-4">
            <Document
              file={file}
              loading={<LoadingState />}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              onLoadError={(err) => setError(err.message ?? "Load error")}
            >
              {numPages
                ? Array.from({ length: numPages }, (_, i) => (
                    <Page
                      key={`page-${i + 1}-${renderWidth}`}
                      pageNumber={i + 1}
                      width={renderWidth}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      className="mb-3 shadow"
                    />
                  ))
                : null}
            </Document>
          </div>
        )}
      </div>

      {title ? <span className="sr-only">{title}</span> : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-[200px] items-center justify-center text-sm text-slate-500">
      Loading PDF…
    </div>
  );
}
