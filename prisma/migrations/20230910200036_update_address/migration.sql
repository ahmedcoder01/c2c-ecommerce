/*
  Warnings:

  - Added the required column `city` to the `ShippingAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `ShippingAddress` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShippingAddress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShippingAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ShippingAddress" ("address", "createdAt", "id", "isDefault", "name", "phone", "updatedAt", "userId") SELECT "address", "createdAt", "id", "isDefault", "name", "phone", "updatedAt", "userId" FROM "ShippingAddress";
DROP TABLE "ShippingAddress";
ALTER TABLE "new_ShippingAddress" RENAME TO "ShippingAddress";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
