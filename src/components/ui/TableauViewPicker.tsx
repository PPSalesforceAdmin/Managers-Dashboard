"use client";

import { useMemo, useState } from "react";
import type { TableauCatalogGroup } from "@/lib/tableau/catalog";
import type { TableauView } from "@/lib/tableau/types";

interface CatalogResponse {
  groups?: TableauCatalogGroup[];
  fetchedAt?: number;
  stale?: boolean;
  error?: string;
}

export function TableauViewPicker() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [groups, setGroups] = useState<TableauCatalogGroup[] | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TableauView | null>(null);

  async function load(refresh = false): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/tableau/catalog${refresh ? "?refresh=1" : ""}`,
        { cache: "no-store" },
      );
      const data = (await res.json()) as CatalogResponse;
      if (!res.ok && !data.groups) {
        setError(data.error ?? "Couldn't load the Tableau catalog.");
        setGroups(null);
        return;
      }
      setGroups(data.groups ?? []);
      setStale(Boolean(data.stale));
      if (data.stale && data.error) setError(data.error);
    } catch {
      setError("Couldn't reach the server to load the Tableau catalog.");
      setGroups(null);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen(): void {
    setOpen(true);
    if (!groups) void load();
  }

  const flatViews = useMemo(() => {
    if (!groups) return [];
    return groups.flatMap((g) =>
      g.workbooks.flatMap((w) =>
        w.views.map((v) => ({
          ...v,
          projectName: v.projectName ?? g.project,
          workbookName: v.workbookName ?? w.workbook,
        })),
      ),
    );
  }, [groups]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return flatViews;
    return flatViews.filter((v) =>
      [v.name, v.workbookName, v.projectName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [flatViews, search]);

  const filteredGroups = useMemo(() => {
    const byProject = new Map<string, Map<string, TableauView[]>>();
    for (const v of filtered) {
      const project = v.projectName ?? "(no project)";
      const workbook = v.workbookName ?? "(no workbook)";
      if (!byProject.has(project)) byProject.set(project, new Map());
      const wb = byProject.get(project)!;
      if (!wb.has(workbook)) wb.set(workbook, []);
      wb.get(workbook)!.push(v);
    }
    return [...byProject.entries()].map(([project, wbMap]) => ({
      project,
      workbooks: [...wbMap.entries()].map(([workbook, views]) => ({
        workbook,
        views,
      })),
    }));
  }, [filtered]);

  function selectView(view: TableauView): void {
    const viewIdInput = document.getElementById(
      "tableauViewId",
    ) as HTMLInputElement | null;
    const contentUrlInput = document.getElementById(
      "tableauContentUrl",
    ) as HTMLInputElement | null;
    const nameInput = document.getElementById(
      "name",
    ) as HTMLInputElement | null;

    if (viewIdInput) viewIdInput.value = view.id;
    if (contentUrlInput) contentUrlInput.value = view.contentUrl;
    if (nameInput && !nameInput.value.trim()) nameInput.value = view.name;

    setSelected(view);
    setOpen(false);
  }

  return (
    <div className="rounded-pp-card border border-black/10 bg-pp-offwhite/60 p-3">
      {selected ? (
        <p className="text-sm text-pp-body/80">
          Selected:{" "}
          <span className="font-semibold text-pp-navy">
            {selected.projectName} / {selected.workbookName} / {selected.name}
          </span>{" "}
          —{" "}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-pp-orange underline"
          >
            change
          </button>
        </p>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="rounded-pp-button border border-black/10 bg-white px-3 py-1.5 text-sm font-semibold text-pp-navy hover:bg-pp-offwhite"
        >
          Browse Tableau catalog
        </button>
      )}

      {open ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project, workbook, or view name…"
              className="w-full rounded-pp-button border border-black/10 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => load(true)}
              disabled={loading}
              className="whitespace-nowrap rounded-pp-button border border-black/10 bg-white px-3 py-2 text-sm hover:bg-pp-offwhite disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="whitespace-nowrap text-sm text-pp-body/60 hover:underline"
            >
              Close
            </button>
          </div>

          {error ? (
            <p className="rounded-pp-button bg-red-50 p-2 text-xs text-red-700 ring-1 ring-red-200">
              {error}
              {stale ? " (showing last-known list below)" : null}
            </p>
          ) : null}

          {loading && !groups ? (
            <p className="text-sm text-pp-body/60">Loading Tableau catalog…</p>
          ) : null}

          {groups && filteredGroups.length === 0 ? (
            <p className="text-sm text-pp-body/60">No matching views.</p>
          ) : null}

          {filteredGroups.length > 0 ? (
            <div className="max-h-80 space-y-3 overflow-y-auto rounded-pp-button border border-black/10 bg-white p-2">
              {filteredGroups.map((g) => (
                <details key={g.project} open={filteredGroups.length <= 3}>
                  <summary className="cursor-pointer text-sm font-semibold text-pp-navy">
                    {g.project}
                  </summary>
                  <div className="mt-1 space-y-2 pl-3">
                    {g.workbooks.map((w) => (
                      <div key={w.workbook}>
                        <p className="text-xs font-medium text-pp-body/70">
                          {w.workbook}
                        </p>
                        <ul>
                          {w.views.map((v) => (
                            <li key={v.id}>
                              <button
                                type="button"
                                onClick={() => selectView(v)}
                                className="w-full rounded px-2 py-1 text-left text-sm hover:bg-pp-orange/10"
                              >
                                {v.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
