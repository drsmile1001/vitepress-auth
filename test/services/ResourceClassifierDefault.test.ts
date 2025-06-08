import { describe, expect, test } from "bun:test";

import { ResourceClassifierDefault } from "@/services/ResourceClassifierDefault";

import { withContext } from "~test/utils/TestContextRunner";

describe("ResourceClassifierDefault", () => {
  async function buildContext() {
    const basePath = "/test/base/path/";
    const classifier = new ResourceClassifierDefault(basePath);
    return {
      classifier,
      basePath,
    };
  }

  test(
    "可以處理根路徑",
    withContext(buildContext, async ({ classifier }) => {
      const path = "/test/base/path/";
      const result = classifier.classify(path);
      expect(result.type).toBe("page");
      expect(result.page).toBe("index.md");
    })
  );

  test(
    "可以處理 html",
    withContext(buildContext, async ({ classifier }) => {
      const path = "/test/base/path/index.html";
      const result = classifier.classify(path);
      expect(result.type).toBe("page");
      expect(result.page).toBe("index.md");
    })
  );

  test(
    "可以處理 md",
    withContext(buildContext, async ({ classifier }) => {
      const path = "/test/base/path/some-page.md";
      const result = classifier.classify(path);
      expect(result.type).toBe("page");
      expect(result.page).toBe("some-page.md");
    })
  );

  test(
    "可以處理 folder/page.md",
    withContext(buildContext, async ({ classifier }) => {
      const path = "/test/base/path/folder/page.md";
      const result = classifier.classify(path);
      expect(result.type).toBe("page");
      expect(result.page).toBe("folder_page.md");
    })
  );

  test(
    "可以處理 lean.js",
    withContext(buildContext, async ({ classifier }) => {
      const path = "/test/base/path/assets/index.md.BcqTVlpu.lean.js";
      const result = classifier.classify(path);
      expect(result.type).toBe("page");
      expect(result.page).toBe("index.md");
    })
  );

  test(
    "可以處理頁面 js",
    withContext(buildContext, async ({ classifier }) => {
      const path = "/test/base/path/assets/other.md.CXRaHTI_.js";
      const result = classifier.classify(path);
      expect(result.type).toBe("page");
      expect(result.page).toBe("other.md");
    })
  );

  test(
    "頁面名稱小寫化",
    withContext(buildContext, async ({ classifier }) => {
      const path = "/test/base/path/assets/SOMEPAGE.md.CXRaHTI_.js";
      const result = classifier.classify(path);
      expect(result.type).toBe("page");
      expect(result.page).toBe("somepage.md");
    })
  );
});
