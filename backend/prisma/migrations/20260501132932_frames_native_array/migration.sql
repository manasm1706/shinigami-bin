/*
  Warnings:

  - The `frames` column on the `AsciiGif` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "AsciiGif" DROP COLUMN "frames",
ADD COLUMN     "frames" TEXT[];
