"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface Props {
  src: string;
  title?: string;
}

export function PdfViewer({ src, title }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setWidth(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const file = useMemo(() => ({ url: src }), [src]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded border border-slate-200 bg-white"
      style={{ height: "85vh" }}
    >
      {error ? (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-600">
          <div>
            <p className="font-medium">Couldn't render the PDF inline.</p>
            <p className="mt-1 text-slate-500">{error}</p>
            <a
              href={`${src}?download=1`}
              className="mt-3 inline-block rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              Download instead
            </a>
          </div>
        </div>
      ) : (
        <TransformWrapper
          minScale={0.5}
          maxScale={4}
          initialScale={1}
          doubleClick={{ mode: "toggle" }}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "100%" }}
          >
            <Document
              file={file}
              loading={<LoadingState />}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              onLoadError={(err) => setError(err.message ?? "Load error")}
            >
              {numPages
                ? Array.from({ length: numPages }, (_, i) => (
                    <Page
                      key={`page-${i + 1}`}
                      pageNumber={i + 1}
                      width={width}
                      devicePixelRatio={3}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      className="mb-2 shadow"
                    />
                  ))
                : null}
            </Document>
          </TransformComponent>
        </TransformWrapper>
      )}

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
