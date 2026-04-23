interface Props {
  src: string;
  title?: string;
}

// Uses the browser's native PDF viewer (PDFium on Chrome, Preview on Safari,
// pdf.js on Firefox). Vector-sharp at any zoom, supports pinch on mobile for
// free. Trade-off: the toolbar shown above the PDF is the browser's native
// one, which looks slightly different across devices.
export function PdfViewer({ src, title }: Props) {
  const downloadHref = `${src}${src.includes("?") ? "&" : "?"}download=1`;
  return (
    <iframe
      src={src}
      title={title ?? "Report PDF"}
      className="h-[85vh] w-full rounded-pp-card bg-white shadow-pp-card-soft"
    >
      <p className="p-4 text-sm text-pp-body/80">
        Your browser can&apos;t display PDFs inline.{" "}
        <a
          className="font-semibold text-pp-orange hover:underline"
          href={downloadHref}
        >
          Download the PDF
        </a>{" "}
        instead.
      </p>
    </iframe>
  );
}
