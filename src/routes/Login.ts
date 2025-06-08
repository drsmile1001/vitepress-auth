import { Elysia } from "elysia";

import { addHours, isBefore } from "date-fns";
import type { ElysiaCookie } from "elysia/cookies";
import { OAuth2Client } from "google-auth-library";

import type { AppServices } from "@/app/AppServices";
import { buildRequestAtProvider } from "@/middlewares/RequestAtProvider";
import type { LoginSession } from "@/services/LoginSessionRepo";
import type { ServiceContainer } from "@/utils/ServiceContainer.Interface";

export function buildLoginRoutes(container: ServiceContainer<AppServices>) {
  const logger = container.resolve("Logger").extend("Login");
  const sessionRepo = container.resolve("LoginSessionRepo");

  const {
    SESSION_COOKIE_NAME,
    COOKIE_SECURE,
    BASE_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
  } = container.resolve("IntegrationConfig");

  function getOauth2Client() {
    return new OAuth2Client({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      redirectUri: "http://localhost:3000/callback",
    });
  }

  function getGoogleAuthUrl(): string {
    return getOauth2Client().generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      prompt: "consent",
    });
  }

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
    .get("/login", async ({ cookie, requestAt, redirect }) => {
      const sessionCookie = cookie[SESSION_COOKIE_NAME];
      const sessionId = sessionCookie.value;
      if (sessionId) {
        const session = await sessionRepo.get(sessionId);
        if (session && isBefore(session.expiredAt, requestAt)) {
          return `你已登入為 ${session.userId}，請先登出再重新登入。`;
        } else {
          sessionRepo.delete(sessionId); // 清除過期的 session
          sessionCookie.remove();
        }
      }
      const redirectUrl = getGoogleAuthUrl();
      return redirect(redirectUrl, 302);
    })
    .get("/callback", async ({ query, cookie, requestAt, redirect }) => {
      const sessionCookie = cookie[SESSION_COOKIE_NAME];
      const { code } = query;
      const client = getOauth2Client();
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return `無效的登入憑證`;
      }
      const userId = payload.email;
      const newSessionId = crypto.randomUUID();
      const expiredAt = addHours(requestAt, 1);
      const newSession: LoginSession = {
        id: newSessionId,
        userId: userId,
        loginAt: requestAt,
        expiredAt,
        providerId: "PROVIDER",
        externalLoginSession: {},
      };
      await sessionRepo.set(newSession);
      sessionCookie.value = newSessionId;
      setCookieLifetime(sessionCookie, expiredAt, requestAt);
      setSecureCookie(sessionCookie);
      return redirect(BASE_URL, 302);
    })
    .get("/logout", async ({ cookie }) => {
      const sessionId = cookie[SESSION_COOKIE_NAME].value;
      if (sessionId) {
        await sessionRepo.delete(sessionId);
        cookie[SESSION_COOKIE_NAME].value = "";
        return "你已登出成功";
      }
      return "你尚未登入";
    });
}
