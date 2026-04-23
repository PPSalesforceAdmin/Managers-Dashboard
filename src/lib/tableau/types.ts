export interface TableauSignInResponse {
  credentials: {
    token: string;
    site: {
      id: string;
      contentUrl: string;
    };
    user: {
      id: string;
    };
  };
}

export interface TableauView {
  id: string;
  name: string;
  contentUrl: string;
  workbookName?: string;
  projectName?: string;
}

interface TableauViewApiShape {
  id: string;
  name: string;
  contentUrl: string;
  workbook?: { id: string; name?: string };
  project?: { id?: string; name?: string };
}

export interface TableauViewsResponse {
  views?: {
    view?: TableauViewApiShape | TableauViewApiShape[];
  };
  pagination?: {
    pageNumber: string;
    pageSize: string;
    totalAvailable: string;
  };
}

export type TableauOrientation = "portrait" | "landscape";

export interface ExportViewOptions {
  orientation?: TableauOrientation;
  filterParams?: Record<string, string | number | boolean>;
}

export class TableauAuthError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "TableauAuthError";
  }
}

export class TableauExportError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "TableauExportError";
  }
}

export class TableauNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TableauNotFoundError";
  }
}
