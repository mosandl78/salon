-- AlterTable
ALTER TABLE "InfoCard" ADD COLUMN "computedKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InfoCard_computedKey_key" ON "InfoCard"("computedKey");
