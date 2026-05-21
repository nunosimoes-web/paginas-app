import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  // Garante que o cliente Prisma gerado entra no bundle standalone.
  outputFileTracingIncludes: {
    "*": ["./node_modules/.prisma/client/**/*"],
  },
};

export default withNextIntl(nextConfig);
