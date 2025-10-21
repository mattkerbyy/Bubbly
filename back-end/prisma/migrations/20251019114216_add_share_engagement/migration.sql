-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "shareId" TEXT;

-- AlterTable
ALTER TABLE "Share" ADD COLUMN     "shareId" TEXT,
ALTER COLUMN "postId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ShareComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareReaction" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShareComment_shareId_idx" ON "ShareComment"("shareId");

-- CreateIndex
CREATE INDEX "ShareComment_userId_idx" ON "ShareComment"("userId");

-- CreateIndex
CREATE INDEX "ShareReaction_shareId_idx" ON "ShareReaction"("shareId");

-- CreateIndex
CREATE INDEX "ShareReaction_userId_idx" ON "ShareReaction"("userId");

-- CreateIndex
CREATE INDEX "ShareReaction_reactionType_idx" ON "ShareReaction"("reactionType");

-- CreateIndex
CREATE UNIQUE INDEX "ShareReaction_shareId_userId_key" ON "ShareReaction"("shareId", "userId");

-- CreateIndex
CREATE INDEX "Notification_shareId_idx" ON "Notification"("shareId");

-- CreateIndex
CREATE INDEX "Share_shareId_idx" ON "Share"("shareId");

-- AddForeignKey
ALTER TABLE "ShareComment" ADD CONSTRAINT "ShareComment_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareComment" ADD CONSTRAINT "ShareComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareReaction" ADD CONSTRAINT "ShareReaction_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareReaction" ADD CONSTRAINT "ShareReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE CASCADE ON UPDATE CASCADE;
