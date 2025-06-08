import { file } from "bun";

import { Type as t } from "@sinclair/typebox";

import type { Logger } from "@/utils/Logger.Interface";

import type {
  PageAccessControlEntry,
  PageAccessControlRepo,
} from "./PageAccessControlRepo";

export class PageAccessControlRepoDefault implements PageAccessControlRepo {
  private readonly logger: Logger;

  constructor(
    logger: Logger,
    private readonly basePath: string,
    private readonly fallbackRole: string
  ) {
    this.logger = logger.extend("PageAccessControlRepoDefault", {
      emoji: "📄",
    });
  }

  async get(page: string): Promise<PageAccessControlEntry | undefined> {
    const logger = this.logger.extend("get", {
      logicalPath: page,
    });
    logger.debug()`取得頁面存取控制設定 ${page}`;
    const map = await this.loadHashmap();

    const hash = map[page];
    if (!hash) {
      logger.debug()`找不到對應的存取控制設定`;
      logger.log(map);
      return undefined;
    }
    const leanJsFilePath = `public${this.basePath}assets/${page}.${hash}.lean.js`;
    const leanJsFile = file(leanJsFilePath);
    const exists = await leanJsFile.exists();
    if (!exists) {
      logger.error()`找不到對應的 Lean JS 檔案: ${leanJsFilePath}`;
      return undefined;
    }
    const leanContent = await leanJsFile.text();
    const meta = parsePageMetadata(leanContent, logger);
    if (!meta) {
      logger.error()`無法解析頁面元數據`;
      return undefined;
    }
    logger.append({
      pageMeta: meta,
    });
    const role = meta.frontmatter.role ?? [this.fallbackRole];
    logger.debug()`${page} 的控制設定: ${role.join(", ")}`;
    return {
      page,
      role,
    };
  }

  async loadHashmap() {
    const hashMapFile = file(`public${this.basePath}hashmap.json`);
    const map: Record<string, string> = await hashMapFile.json();
    return map;
  }
}

const pageMetadataSchema = t.Object(
  {
    title: t.String(),
    filePath: t.String(),
    frontmatter: t.Record(t.String(), t.Any()),
    headers: t.Array(t.Any()),
    relativePath: t.String(),
    description: t.String(),
  },
  {
    additionalProperties: true,
  }
);

export type PageMetadata = typeof pageMetadataSchema.static;

export function parsePageMetadata(
  leanContent: string,
  logger: Logger
): PageMetadata | undefined {
  const parserLogger = logger.extend("parsePageMetadata", {
    emoji: "🔍",
  });
  try {
    const statments = leanContent.split(";");
    for (const statment of statments) {
      if (!statment.startsWith("const")) continue;
      const jsonParse = "JSON.parse('";
      const indexOfJsonParse = statment.indexOf(jsonParse);
      if (indexOfJsonParse === -1) continue;
      const rightIndex = statment.indexOf("')", indexOfJsonParse);
      if (rightIndex === -1) continue;
      const jsonString = statment.slice(
        indexOfJsonParse + jsonParse.length,
        rightIndex
      );
      const context = JSON.parse(jsonString);
      return context;
    }
    return undefined;
  } catch (error) {
    parserLogger.error(
      {
        error,
      },
      "無法解析頁面元數據"
    );
    return undefined;
  }
}
