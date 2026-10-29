import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16: o antigo "middleware" chama-se agora "proxy".
// Aqui trata apenas do encaminhamento por locale (next-intl).
// A proteção de rotas autenticadas é feita server-side nas próprias páginas.
const localeMiddleware = createMiddleware(routing);

// Keep old email links usable, including their signed query parameters.
// API routes stay on both hosts so existing scheduled jobs keep working.
export default function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];
  if (host === "paginas.paginasemetaforas.pt" || host === "paginas.178.104.201.64.sslip.io") {
    const target = new URL(request.nextUrl.pathname + request.nextUrl.search, "https://mindwink.cognixhub.com");
    return NextResponse.redirect(target, 307);
  }
  return localeMiddleware(request);
}

export const config = {
  // Corre em tudo exceto API, assets internos e ficheiros estáticos.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
