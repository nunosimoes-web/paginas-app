CREATE TABLE "PublicFormQuota" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PublicFormQuota_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PublicFormQuota_expiresAt_idx" ON "PublicFormQuota"("expiresAt");
