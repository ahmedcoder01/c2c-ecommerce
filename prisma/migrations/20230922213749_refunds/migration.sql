/*
  Warnings:

  - You are about to drop the column `orderId` on the `RefundRequest` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RefundRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderItemId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "RefundRequest_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RefundRequest" ("createdAt", "id", "orderItemId", "reason", "status", "updatedAt") SELECT "createdAt", "id", "orderItemId", "reason", "status", "updatedAt" FROM "RefundRequest";
DROP TABLE "RefundRequest";
ALTER TABLE "new_RefundRequest" RENAME TO "RefundRequest";
CREATE UNIQUE INDEX "RefundRequest_orderItemId_key" ON "RefundRequest"("orderItemId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
