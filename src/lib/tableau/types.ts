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
