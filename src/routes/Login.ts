import { Elysia } from "elysia";

import { addHours } from "date-fns";
import type { ElysiaCookie } from "elysia/cookies";

import type { AppServices } from "@/app/AppServices";
import { buildRequestAtProvider } from "@/middlewares/RequestAtProvider";
import type { LoginSession } from "@/services/LoginSessionRepo";
import type { ServiceContainer } from "@/utils/ServiceContainer.Interface";

export function buildLoginRoutes(container: ServiceContainer<AppServices>) {
  const logger = container.resolve("Logger").extend("Login");
  const sessionRepo = container.resolve("LoginSessionRepo");

  const { SESSION_COOKIE_NAME, COOKIE_SECURE, BASE_URL } =
    container.resolve("IntegrationConfig");

  function setSecureCookie(cookie: ElysiaCookie) {
    cookie.secure = COOKIE_SECURE;
    cookie.sameSite = "lax";
    cookie.httpOnly = true;
    cookie.path = BASE_URL;
  }

  function setCookieLifetime(
    cookie: ElysiaCookie,
    expireTime: Date,
    now: Date
  ) {
    cookie.expires = expireTime;
    cookie.maxAge = Math.floor((expireTime.getTime() - now.getTime()) / 1000);
  }
  return new Elysia({
    name: "Login",
  })
    .use(buildRequestAtProvider(container))
    .get("/login", async ({ cookie, query, requestAt }) => {
      const sessionCookie = cookie[SESSION_COOKIE_NAME];
      const oldSessionId = sessionCookie?.value;
      if (oldSessionId) {
        await sessionRepo.delete(oldSessionId);
      }

      const newSessionId = crypto.randomUUID();
      const expiredAt = addHours(requestAt, 1);
      const newSession: LoginSession = {
        id: newSessionId,
        userId: query.userId ?? "USER",
        loginAt: requestAt,
        expiredAt,
        providerId: "PROVIDER",
        externalLoginSession: {},
      };
      await sessionRepo.set(newSession);
      sessionCookie.value = newSessionId;
      setCookieLifetime(sessionCookie, expiredAt, requestAt);
      setSecureCookie(sessionCookie);
      return "Logged in successfully";
    })
    .get("/logout", async ({ cookie }) => {
      const sessionId = cookie[SESSION_COOKIE_NAME].value;
      if (sessionId) {
        await sessionRepo.delete(sessionId);
        cookie[SESSION_COOKIE_NAME].value = "";
        return "Logged out successfully";
      }
      return "No active session found";
    });
}
