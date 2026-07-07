import { TableauView } from "./types";

export interface TableauCatalogGroup {
  project: string;
  workbooks: { workbook: string; views: TableauView[] }[];
}

export function groupViewsByProjectAndWorkbook(
  views: TableauView[],
): TableauCatalogGroup[] {
  const byProject = new Map<string, Map<string, TableauView[]>>();
  for (const v of views) {
    const project = v.projectName ?? "(no project)";
    const workbook = v.workbookName ?? "(no workbook)";
    if (!byProject.has(project)) byProject.set(project, new Map());
    const wb = byProject.get(project)!;
    if (!wb.has(workbook)) wb.set(workbook, []);
    wb.get(workbook)!.push(v);
  }

  return [...byProject.keys()].sort().map((project) => {
    const wbMap = byProject.get(project)!;
    return {
      project,
      workbooks: [...wbMap.keys()].sort().map((workbook) => ({
        workbook,
        views: wbMap.get(workbook)!,
      })),
    };
  });
}
