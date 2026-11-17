-- AlterTable
ALTER TABLE "quack" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "replyToId" TEXT;

-- CreateIndex
CREATE INDEX "quack_replyToId_idx" ON "quack"("replyToId");

-- AddForeignKey
ALTER TABLE "quack" ADD CONSTRAINT "quack_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "quack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
