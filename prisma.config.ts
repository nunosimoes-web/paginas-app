import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7: connection URLs e seed vivem aqui, fora do schema.prisma.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
