/*
  Warnings:

  - You are about to drop the column `image` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "image",
DROP COLUMN "images",
ADD COLUMN     "file" TEXT,
ADD COLUMN     "files" TEXT[] DEFAULT ARRAY[]::TEXT[];
