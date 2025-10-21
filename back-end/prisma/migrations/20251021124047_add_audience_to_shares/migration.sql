-- AlterTable
ALTER TABLE "Share" ADD COLUMN     "audience" TEXT NOT NULL DEFAULT 'Public';

-- CreateIndex
CREATE INDEX "Share_audience_idx" ON "Share"("audience");
