import {
  ExportViewOptions,
  TableauAuthError,
  TableauExportError,
  TableauNotFoundError,
  TableauSignInResponse,
} from "./types";

interface TableauClientConfig {
  siteUrl: string;
  siteContentUrl: string;
  patName: string;
  patSecret: string;
  apiVersion: string;
}

export class TableauClient {
  private token: string | null = null;
  private siteLuid: string | null = null;

  constructor(private readonly config: TableauClientConfig) {
    if (!config.siteUrl) throw new TableauAuthError("TABLEAU_SITE_URL not set");
    if (!config.patName) throw new TableauAuthError("TABLEAU_PAT_NAME not set");
    if (!config.patSecret) throw new TableauAuthError("TABLEAU_PAT_SECRET not set");
  }

  static fromEnv(): TableauClient {
    return new TableauClient({
      siteUrl: process.env.TABLEAU_SITE_URL ?? "",
      siteContentUrl: process.env.TABLEAU_SITE_CONTENT_URL ?? "",
      patName: process.env.TABLEAU_PAT_NAME ?? "",
      patSecret: process.env.TABLEAU_PAT_SECRET ?? "",
      apiVersion: process.env.TABLEAU_API_VERSION ?? "3.22",
    });
  }

  private baseUrl(): string {
    return `${this.config.siteUrl.replace(/\/$/, "")}/api/${this.config.apiVersion}`;
  }

  async signIn(): Promise<void> {
    const res = await fetch(`${this.baseUrl()}/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        credentials: {
          personalAccessTokenName: this.config.patName,
          personalAccessTokenSecret: this.config.patSecret,
          site: { contentUrl: this.config.siteContentUrl },
        },
      }),
    });

    if (!res.ok) {
      throw new TableauAuthError(
        `Tableau signin failed (${res.status})`,
        res.status,
      );
    }

    const data = (await res.json()) as TableauSignInResponse;
    this.token = data.credentials.token;
    this.siteLuid = data.credentials.site.id;
  }

  async signOut(): Promise<void> {
    if (!this.token) return;
    try {
      await fetch(`${this.baseUrl()}/auth/signout`, {
        method: "POST",
        headers: { "X-Tableau-Auth": this.token },
      });
    } finally {
      this.token = null;
      this.siteLuid = null;
    }
  }

  private ensureSignedIn(): { token: string; siteLuid: string } {
    if (!this.token || !this.siteLuid) {
      throw new TableauAuthError("Not signed in. Call signIn() first.");
    }
    return { token: this.token, siteLuid: this.siteLuid };
  }

  private buildExportUrl(
    viewLuid: string,
    kind: "pdf" | "image",
    options: ExportViewOptions,
  ): string {
    const { siteLuid } = this.ensureSignedIn();
    const params = new URLSearchParams();
    if (kind === "pdf") {
      params.set("type", "a4");
      params.set("orientation", options.orientation ?? "landscape");
    }
    if (options.filterParams) {
      for (const [k, v] of Object.entries(options.filterParams)) {
        params.set(k, String(v));
      }
    }
    const qs = params.toString();
    return `${this.baseUrl()}/sites/${siteLuid}/views/${viewLuid}/${kind}${qs ? `?${qs}` : ""}`;
  }

  async exportViewPdf(
    viewLuid: string,
    options: ExportViewOptions = {},
  ): Promise<Buffer> {
    const { token } = this.ensureSignedIn();
    const url = this.buildExportUrl(viewLuid, "pdf", options);

    const res = await fetch(url, {
      method: "GET",
      headers: { "X-Tableau-Auth": token, Accept: "application/pdf" },
    });

    if (res.status === 404) {
      throw new TableauNotFoundError(`View ${viewLuid} not found`);
    }
    if (!res.ok) {
      throw new TableauExportError(
        `Tableau PDF export failed (${res.status})`,
        res.status,
      );
    }

    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  }

  async exportViewPng(
    viewLuid: string,
    options: ExportViewOptions = {},
  ): Promise<Buffer> {
    const { token } = this.ensureSignedIn();
    const url = this.buildExportUrl(viewLuid, "image", options);

    const res = await fetch(url, {
      method: "GET",
      headers: { "X-Tableau-Auth": token, Accept: "image/png" },
    });

    if (res.status === 404) {
      throw new TableauNotFoundError(`View ${viewLuid} not found`);
    }
    if (!res.ok) {
      throw new TableauExportError(
        `Tableau PNG export failed (${res.status})`,
        res.status,
      );
    }

    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  }
}
