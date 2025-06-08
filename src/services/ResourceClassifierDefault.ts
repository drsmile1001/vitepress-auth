import type { Resource } from "@/schemas/Resource";

import type { ResourceClassifier } from "./ResourceClassifier";

export class ResourceClassifierDefault implements ResourceClassifier {
  constructor(private readonly baseUrl: string) {}

  private safeExts = [
    "css",
    "woff",
    "woff2",
    "ttf",
    "otf",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "svg",
    "ico",
    "json",
    "map",
  ];

  private isSafeExtUrl(pathname: string): boolean {
    return this.safeExts.some((ext) => pathname.endsWith(`.${ext}`));
  }

  private isSafeJsUrl(pathname: string): boolean {
    return pathname.endsWith(".js") && !pathname.includes(".md.");
  }

  private getPage(pathname: string): string | null {
    if (!pathname.startsWith(this.baseUrl)) {
      return null;
    }
    const relativePath = pathname.slice(this.baseUrl.length);
    if (relativePath === "") {
      return "index.md";
    }
    if (relativePath.endsWith("html")) {
      return relativePath.slice(0, -5) + ".md";
    }
    if (relativePath.endsWith("md")) {
      return relativePath;
    }
    if (
      relativePath.startsWith("assets/") &&
      relativePath.endsWith(".lean.js")
    ) {
      const pageAndHash = relativePath.slice(
        "assets/".length,
        -".lean.js".length
      );
      const hashLength = 8 + 1; // 8 characters for the hash and 1 for the dot
      const pagePath = pageAndHash.slice(0, -hashLength);
      if (pagePath.endsWith(".md")) {
        return pagePath;
      }
    }
    if (relativePath.startsWith("assets/") && relativePath.endsWith(".js")) {
      const pageAndHash = relativePath.slice("assets/".length, -".js".length);
      const hashLength = 8 + 1; // 8 characters for the hash and 1 for the dot
      const pagePath = pageAndHash.slice(0, -hashLength);
      if (pagePath.endsWith(".md")) {
        return pagePath;
      }
    }
    return null;
  }

  classify(pathname: string): Resource {
    const page = this.getPage(pathname);
    if (page) {
      return { type: "page", page: page.toLowerCase().replace("/", "_") };
    }

    if (this.isSafeExtUrl(pathname)) {
      return { type: "safeExt", page: null };
    }
    if (this.isSafeJsUrl(pathname)) {
      return { type: "safeJs", page: null };
    }

    return { type: "unknown", page: null };
  }
}
