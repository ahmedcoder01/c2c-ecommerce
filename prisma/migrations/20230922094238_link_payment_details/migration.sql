/*
  Warnings:

  - You are about to drop the column `status` on the `PaymentDetails` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PaymentDetails" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paymentMethod" TEXT,
    "processorProvider" TEXT NOT NULL DEFAULT 'STRIPE',
    "paymentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PaymentDetails" ("createdAt", "id", "paymentId", "paymentMethod", "processorProvider", "updatedAt") SELECT "createdAt", "id", "paymentId", "paymentMethod", "processorProvider", "updatedAt" FROM "PaymentDetails";
DROP TABLE "PaymentDetails";
ALTER TABLE "new_PaymentDetails" RENAME TO "PaymentDetails";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
