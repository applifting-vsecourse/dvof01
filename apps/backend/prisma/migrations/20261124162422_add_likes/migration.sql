-- CreateTable
CREATE TABLE "like" (
    "id" TEXT NOT NULL,
    "quackId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "like_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "like_quackId_idx" ON "like"("quackId");

-- CreateIndex
CREATE UNIQUE INDEX "like_userId_quackId_key" ON "like"("userId", "quackId");

-- AddForeignKey
ALTER TABLE "like" ADD CONSTRAINT "like_quackId_fkey" FOREIGN KEY ("quackId") REFERENCES "quack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like" ADD CONSTRAINT "like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
