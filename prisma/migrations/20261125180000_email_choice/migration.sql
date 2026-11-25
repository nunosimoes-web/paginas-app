-- Registo da escolha explícita sobre o email diário (docs/MINDWINK.md).
-- Migração aditiva: só acrescenta colunas opcionais, não altera dados nem as
-- preferências das contas existentes.
ALTER TABLE "User"
  ADD COLUMN "emailChoiceAt" TIMESTAMP(3),
  ADD COLUMN "emailChoiceSource" TEXT;
