-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "asciiGifId" TEXT;

-- CreateTable
CREATE TABLE "AsciiGif" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "frames" TEXT NOT NULL,
    "frameDelay" INTEGER NOT NULL DEFAULT 150,
    "width" INTEGER NOT NULL DEFAULT 80,
    "height" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsciiGif_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_asciiGifId_fkey" FOREIGN KEY ("asciiGifId") REFERENCES "AsciiGif"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsciiGif" ADD CONSTRAINT "AsciiGif_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
