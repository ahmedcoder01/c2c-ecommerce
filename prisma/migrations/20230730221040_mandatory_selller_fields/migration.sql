/*
  Warnings:

  - Made the column `name` on table `SellerProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `SellerProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SellerProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isActivated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SellerProfile" ("createdAt", "id", "isActivated", "name", "phone", "updatedAt", "userId") SELECT "createdAt", "id", "isActivated", "name", "phone", "updatedAt", "userId" FROM "SellerProfile";
DROP TABLE "SellerProfile";
ALTER TABLE "new_SellerProfile" RENAME TO "SellerProfile";
CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
