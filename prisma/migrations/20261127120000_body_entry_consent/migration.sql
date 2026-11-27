-- Prova do consentimento explícito no diário do corpo (RGPD art. 7.º/9.º).
-- Aditiva e anulável: não mexe em registos existentes.
ALTER TABLE "BodyEntry" ADD COLUMN "consentAt" TIMESTAMP(3);
ALTER TABLE "BodyEntry" ADD COLUMN "consentVersion" TEXT;
