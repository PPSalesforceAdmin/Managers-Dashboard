import type { Category, Report } from "@prisma/client";

interface Props {
  categories: Pick<Category, "id" | "name">[];
  report?: Report | null;
}

export function ReportFormFields({ categories, report }: Props) {
  const defaults = {
    name: report?.name ?? "",
    description: report?.description ?? "",
    categoryId: report?.categoryId ?? "",
    tableauViewId: report?.tableauViewId ?? "",
    tableauContentUrl: report?.tableauContentUrl ?? "",
    filterParams: report?.filterParams
      ? JSON.stringify(report.filterParams, null, 2)
      : "",
    orientation: report?.orientation ?? "LANDSCAPE",
    exportFormat: report?.exportFormat ?? "PDF",
    refreshCron: report?.refreshCron ?? "0 * * * *",
    enabled: report ? report.enabled : true,
  };

  return (
    <div className="grid gap-4">
      <Field label="Name" hint="Shown to users on the reports grid.">
        <input
          name="name"
          defaultValue={defaults.name}
          required
          className="w-full rounded-pp-button border border-black/10 px-3 py-2"
        />
      </Field>

      <Field label="Description" hint="Optional — shown on the report tile.">
        <input
          name="description"
          defaultValue={defaults.description}
          className="w-full rounded-pp-button border border-black/10 px-3 py-2"
        />
      </Field>

      <Field label="Category">
        <select
          name="categoryId"
          defaultValue={defaults.categoryId}
          className="w-full rounded-pp-button border border-black/10 px-3 py-2"
        >
          <option value="">— none —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Tableau view LUID"
        hint={'Run `npm run tableau:views` locally to list LUIDs.'}
      >
        <input
          name="tableauViewId"
          defaultValue={defaults.tableauViewId}
          required
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="w-full rounded-pp-button border border-black/10 px-3 py-2 font-mono text-xs"
        />
      </Field>

      <Field
        label="Tableau content URL"
        hint="Human-readable path, e.g. `CETTargets/sheets/DailyCalls4Mths`."
      >
        <input
          name="tableauContentUrl"
          defaultValue={defaults.tableauContentUrl}
          className="w-full rounded-pp-button border border-black/10 px-3 py-2 font-mono text-xs"
        />
      </Field>

      <Field
        label="Filter params (JSON)"
        hint='Optional. Example: `{"vf_Region": "North"}`. Leave blank for none.'
      >
        <textarea
          name="filterParams"
          defaultValue={defaults.filterParams}
          rows={3}
          className="w-full rounded-pp-button border border-black/10 px-3 py-2 font-mono text-xs"
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Export format">
          <select
            name="exportFormat"
            defaultValue={defaults.exportFormat}
            className="w-full rounded-pp-button border border-black/10 px-3 py-2"
          >
            <option value="PDF">PDF</option>
            <option value="PNG">PNG</option>
          </select>
        </Field>

        <Field label="Orientation (PDF only)">
          <select
            name="orientation"
            defaultValue={defaults.orientation}
            className="w-full rounded-pp-button border border-black/10 px-3 py-2"
          >
            <option value="LANDSCAPE">Landscape</option>
            <option value="PORTRAIT">Portrait</option>
          </select>
        </Field>
      </div>

      <Field
        label="Refresh cron"
        hint="5-field cron. Default hourly. e.g. `0 6 * * *` = daily at 06:00."
      >
        <input
          name="refreshCron"
          defaultValue={defaults.refreshCron}
          className="w-full rounded-pp-button border border-black/10 px-3 py-2 font-mono text-xs"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={defaults.enabled}
          className="h-4 w-4"
        />
        Enabled (worker will export on schedule)
      </label>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-pp-navy">
        {label}
      </label>
      {children}
      {hint ? (
        <p className="mt-1 text-xs text-pp-body/60">{hint}</p>
      ) : null}
    </div>
  );
}
