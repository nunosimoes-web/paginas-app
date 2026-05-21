-- AlterTable
-- Regista quando a peça do dia foi enviada por email (idempotência do envio diário).
ALTER TABLE "PromptDelivery" ADD COLUMN     "emailSentAt" TIMESTAMP(3);
