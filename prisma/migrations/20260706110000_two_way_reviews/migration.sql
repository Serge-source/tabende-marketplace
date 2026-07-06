-- DropIndex
DROP INDEX "Review_orderId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Review_orderId_reviewerId_key" ON "Review"("orderId", "reviewerId");
