-- AlterTable
-- Opt-in do email diário (predefinição: ativo; desligável nas definições / unsubscribe).
ALTER TABLE "User" ADD COLUMN     "emailDaily" BOOLEAN NOT NULL DEFAULT true;
