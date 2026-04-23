"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  reportId: string;
  initialLastExportedAt: string | null;
  pollIntervalMs?: number;
}

interface MetaResponse {
  id: string;
  lastExportedAt: string | null;
  lastExportStatus: string;
}

export function PdfRefreshWatcher({
  reportId,
  initialLastExportedAt,
  pollIntervalMs = 120_000,
}: Props) {
  const router = useRouter();
  const baselineRef = useRef<string | null>(initialLastExportedAt);
  const [newerTimestamp, setNewerTimestamp] = useState<string | null>(null);

  useEffect(() => {
    baselineRef.current = initialLastExportedAt;
    setNewerTimestamp(null);
  }, [initialLastExportedAt, reportId]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/reports/${reportId}/meta`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as MetaResponse;
        if (cancelled) return;
        if (!data.lastExportedAt) return;
        const baseline = baselineRef.current;
        if (!baseline || data.lastExportedAt > baseline) {
          // A newer export exists than the one rendered on the server.
          // Only surface the banner if baseline was non-null (first-ever
          // export triggers a full refresh below rather than a banner).
          if (!baseline) {
            router.refresh();
            baselineRef.current = data.lastExportedAt;
            return;
          }
          setNewerTimestamp(data.lastExportedAt);
        }
      } catch {
        /* network blip — try again next tick */
      }
    }
    const id = setInterval(poll, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [reportId, pollIntervalMs, router]);

  if (!newerTimestamp) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 rounded-pp-card border border-pp-orange/40 bg-pp-orange/10 px-4 py-3 text-sm"
    >
      <div>
        <span className="font-bold text-pp-navy">A new version is ready.</span>{" "}
        <span className="text-pp-body/80">
          Reload to see the latest export.
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          baselineRef.current = newerTimestamp;
          setNewerTimestamp(null);
          router.refresh();
        }}
        className="rounded-pp-button-lg bg-pp-orange px-4 py-1.5 text-sm font-bold text-white transition hover:brightness-110"
      >
        Reload
      </button>
    </div>
  );
}
