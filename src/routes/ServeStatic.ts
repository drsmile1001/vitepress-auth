import { Elysia } from "elysia";

import { staticPlugin } from "@elysiajs/static";

import type { AppServices } from "@/app/AppServices";
import { buildRequestLoggerProvider } from "@/middlewares/RequestMonitor";
import { buildRequesterProvider } from "@/middlewares/RequesterProvider";
import { anonymous } from "@/services/IdentityResolver";
import type { ServiceContainer } from "@/utils/ServiceContainer.Interface";

export function buildServeStaticRoutes(
  container: ServiceContainer<AppServices>
) {
  const { PUBLIC_ROLE, AUTHENTICATED_ROLE } = container.resolve("RoleConfig");
  const pageAccessControlRepo = container.resolve("PageAccessControlRepo");
  const userRoleRepo = container.resolve("UserRoleRepo");
  const classifier = container.resolve("ResourceClassifier");

  const route = new Elysia({
    name: "ServeStatic",
  })
    .use(buildRequesterProvider(container))
    .use(buildRequestLoggerProvider(container))
    .onBeforeHandle(async ({ request, requester, logger, set, status }) => {
      const accessControlLogger = logger.extend("access-control", {
        emoji: "🔒",
      });
      let pathname = decodeURIComponent(new URL(request.url).pathname);
      accessControlLogger.append({ pathname });
      accessControlLogger.debug()`檢查存取控制 ${pathname}`;
      const resource = classifier.classify(pathname);
      accessControlLogger.append({ resource });
      if (resource.type === "safeExt") {
        accessControlLogger.debug("是安全的靜態資源，跳過檢查");
        return;
      }
      if (resource.type === "safeJs") {
        accessControlLogger.debug("是安全的 JavaScript 資源，跳過檢查");
        return;
      }
      if (resource.type !== "page" || !resource.page) {
        accessControlLogger.warn("不明邏輯路徑");
        return status(403, "Forbidden");
      }
      accessControlLogger.debug()`檢查頁面存取控制設定 ${resource.page}`;
      set.headers["cache-control"] =
        "no-store, no-cache, must-revalidate, proxy-revalidate";
      set.headers["pragma"] = "no-cache";
      set.headers["expires"] = "0";
      const pageAccessControl = await pageAccessControlRepo.get(resource.page);
      if (!pageAccessControl) {
        accessControlLogger.warn("找不到頁面存取控制設定");
        return status(403, "Forbidden");
      }
      if (pageAccessControl.role.includes(PUBLIC_ROLE)) {
        accessControlLogger.debug("頁面允許公開存取");
        return;
      }
      if (requester === anonymous) {
        accessControlLogger.warn("匿名使用者無權存取");
        return status(403, "Forbidden");
      }
      if (pageAccessControl.role.includes(AUTHENTICATED_ROLE)) {
        accessControlLogger.debug("頁面允許已認證使用者存取");
        return;
      }
      const userRole = await userRoleRepo.get(requester.id);
      if (!userRole) {
        accessControlLogger.warn("找不到使用者角色");
        return status(403, "Forbidden");
      }
      accessControlLogger.append({
        userRole,
      });
      const match = pageAccessControl.role.some((r) => userRole.includes(r));
      if (!match) {
        accessControlLogger.debug("使用者角色不符合存取控制要求");
        return status(403, "Forbidden");
      }
      accessControlLogger.debug("存取控制檢查通過");
    })
    .use(
      staticPlugin({
        prefix: "/",
        alwaysStatic: false,
        enableDecodeURI: true,
      })
    );
  return route;
}
