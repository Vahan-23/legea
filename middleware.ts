import createMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "./i18n/routing";

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  matcher: [
    "/",
    "/(ru|hy|en)/:path*",
    "/((?!api|_next|_vercel|icon|apple-icon|manifest|.*\\..*).*)",
  ],
};
