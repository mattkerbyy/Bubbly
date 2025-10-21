/*
  Warnings:

  - You are about to drop the column `shareId` on the `Share` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[postId,userId]` on the table `Share` will be added. If there are existing duplicate values, this will fail.
  - Made the column `postId` on table `Share` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Share" DROP CONSTRAINT "Share_shareId_fkey";

-- DropIndex
DROP INDEX "Share_shareId_idx";

-- AlterTable
ALTER TABLE "Share" DROP COLUMN "shareId",
ALTER COLUMN "postId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Share_postId_userId_key" ON "Share"("postId", "userId");
