-- Medição de aberturas e cliques do email diário.
ALTER TABLE "PromptDelivery" ADD COLUMN "emailOpenedAt" TIMESTAMP(3);
ALTER TABLE "PromptDelivery" ADD COLUMN "emailOpenCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PromptDelivery" ADD COLUMN "emailClickedAt" TIMESTAMP(3);
ALTER TABLE "PromptDelivery" ADD COLUMN "emailClickCount" INTEGER NOT NULL DEFAULT 0;
