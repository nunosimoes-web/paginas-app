-- Mindwink Plus: camada paga + módulo Corpo. Migração aditiva: não remove
-- colunas, tabelas ou dados existentes. Os 7 utilizadores atuais à data desta
-- migração são marcados "founder" (sem paywall, sem cobrança, sem anúncio).

CREATE TYPE "Plan" AS ENUM ('FREE', 'PLUS', 'THERAPIST_PRO');

ALTER TABLE "User"
  ADD COLUMN "plan" "Plan" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "planSource" TEXT,
  ADD COLUMN "stripeCustomerId" TEXT,
  ADD COLUMN "planRenewsAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- Marca TODOS os utilizadores já existentes como founder. Esta instrução
-- afecta apenas linhas atuais; novos registos pós-migração ficam FREE sem
-- planSource até escolherem uma camada paga.
UPDATE "User" SET "planSource" = 'founder';

-- Confirma que o seed de conteúdo não força mais a revisão: o Nuno revê
-- as 365 peças offline e aqui marcamos todas como revistas. Esta instrução
-- respeita o conteúdo em si (bodyI18n, etc.) — só muda a flag de revisão.
UPDATE "ContentPiece" SET "needsReview" = false;

CREATE TABLE "Purchase" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "stripeSessionId" TEXT NOT NULL,
  "stripePaymentIntent" TEXT,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Purchase_stripeSessionId_key" ON "Purchase"("stripeSessionId");
CREATE UNIQUE INDEX "Purchase_stripePaymentIntent_key" ON "Purchase"("stripePaymentIntent");
CREATE INDEX "Purchase_userId_sku_idx" ON "Purchase"("userId", "sku");

ALTER TABLE "Purchase"
  ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId")
  REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BodyEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "region" TEXT NOT NULL,
  "intensity" INTEGER NOT NULL DEFAULT 0,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BodyEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BodyEntry_userId_date_idx" ON "BodyEntry"("userId", "date");

ALTER TABLE "BodyEntry"
  ADD CONSTRAINT "BodyEntry_userId_fkey" FOREIGN KEY ("userId")
  REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Program" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "titleI18n" JSONB NOT NULL,
  "summaryI18n" JSONB NOT NULL,
  "days" INTEGER NOT NULL DEFAULT 21,
  "pieceOrder" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Program_slug_key" ON "Program"("slug");

CREATE TABLE "ProgramEnrollment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "ProgramEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProgramEnrollment_userId_programId_key"
  ON "ProgramEnrollment"("userId", "programId");

ALTER TABLE "ProgramEnrollment"
  ADD CONSTRAINT "ProgramEnrollment_userId_fkey" FOREIGN KEY ("userId")
  REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProgramEnrollment"
  ADD CONSTRAINT "ProgramEnrollment_programId_fkey" FOREIGN KEY ("programId")
  REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
