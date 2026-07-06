-- AlterTable
ALTER TABLE "User" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'pap';

-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Translation_locale_key_key" ON "Translation"("locale", "key");

-- CreateIndex
CREATE INDEX "Translation_locale_idx" ON "Translation"("locale");
