import { isBefore } from "date-fns";

import type { Identity } from "@/schemas/Identity";
import type { Logger } from "@/utils/Logger.Interface";

import {
  type Anonymous,
  type IdentityResolver,
  type Unauthorized,
  anonymous,
  unauthorized,
} from "./IdentityResolver";
import type { LoginSessionRepo } from "./LoginSessionRepo";
import type { SystemTime } from "./SystemTime";

export class IdentityResolverDefault implements IdentityResolver {
  private logger: Logger;
  constructor(
    private readonly sessionCookieName: string,
    private readonly sessionRepo: LoginSessionRepo,
    private readonly systemTime: SystemTime,
    logger: Logger
  ) {
    this.logger = logger.extend("IdentityResolverDefault", {
      emoji: "👤",
    });
  }

  async resolve(
    headers: Record<string, string | undefined>
  ): Promise<Identity | Anonymous | Unauthorized> {
    const logger = this.logger.extend("resolve");
    logger.debug("開始解析請求者身份");
    const now = this.systemTime.now();
    const sessionId = headers.cookie
      ?.split("; ")
      .find((cookie) => cookie.startsWith(`${this.sessionCookieName}=`))
      ?.split("=")[1];
    logger.append({
      sessionId,
      now: now.toISOString(),
    });
    if (sessionId === undefined) {
      logger.debug("未提供 sessionId，回傳匿名身份");
      return anonymous;
    }
    const session = await this.sessionRepo.get(sessionId);
    logger.append({
      session,
    });
    if (session === undefined) {
      logger.debug("sessionId 無效，回傳未授權");
      return unauthorized;
    }
    if (isBefore(session.expiredAt, now)) {
      logger.debug("session 已過期，回傳未授權");
      await this.sessionRepo.delete(sessionId);
      return unauthorized;
    }
    logger.debug()`session 有效，回傳使用者身份 ${session.userId}`;
    return {
      id: session.userId,
      credential: {
        type: "cookie",
      },
    };
  }
}
