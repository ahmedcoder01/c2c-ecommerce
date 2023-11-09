/*
  Warnings:

  - You are about to drop the column `userId` on the `PaymentDetails` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "shippingAddressId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "paymentDetailsId" INTEGER,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "ShippingAddress" ("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "Order_paymentDetailsId_fkey" FOREIGN KEY ("paymentDetailsId") REFERENCES "PaymentDetails" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "id", "shippingAddressId", "status", "updatedAt", "userId") SELECT "createdAt", "id", "shippingAddressId", "status", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_paymentDetailsId_key" ON "Order"("paymentDetailsId");
CREATE TABLE "new_SellerBalanceLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" REAL NOT NULL,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sellerBalanceId" INTEGER NOT NULL,
    "orderId" INTEGER,
    CONSTRAINT "SellerBalanceLog_sellerBalanceId_fkey" FOREIGN KEY ("sellerBalanceId") REFERENCES "SellerBalance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SellerBalanceLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SellerBalanceLog" ("amount", "createdAt", "id", "message", "orderId", "sellerBalanceId", "updatedAt") SELECT "amount", "createdAt", "id", "message", "orderId", "sellerBalanceId", "updatedAt" FROM "SellerBalanceLog";
DROP TABLE "SellerBalanceLog";
ALTER TABLE "new_SellerBalanceLog" RENAME TO "SellerBalanceLog";
CREATE TABLE "new_PaymentDetails" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paymentMethod" TEXT,
    "processorProvider" TEXT NOT NULL DEFAULT 'STRIPE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PaymentDetails" ("createdAt", "id", "paymentId", "paymentMethod", "processorProvider", "status", "updatedAt") SELECT "createdAt", "id", "paymentId", "paymentMethod", "processorProvider", "status", "updatedAt" FROM "PaymentDetails";
DROP TABLE "PaymentDetails";
ALTER TABLE "new_PaymentDetails" RENAME TO "PaymentDetails";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
