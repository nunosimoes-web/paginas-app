import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16: o antigo "middleware" chama-se agora "proxy".
// Aqui trata apenas do encaminhamento por locale (next-intl).
// A proteção de rotas autenticadas é feita server-side nas próprias páginas.
export default createMiddleware(routing);

export const config = {
  // Corre em tudo exceto API, assets internos e ficheiros estáticos.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
