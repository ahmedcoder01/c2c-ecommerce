-- CreateTable
CREATE TABLE "SellerBalanceLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" REAL NOT NULL,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sellerBalanceId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    CONSTRAINT "SellerBalanceLog_sellerBalanceId_fkey" FOREIGN KEY ("sellerBalanceId") REFERENCES "SellerBalance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SellerBalanceLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
