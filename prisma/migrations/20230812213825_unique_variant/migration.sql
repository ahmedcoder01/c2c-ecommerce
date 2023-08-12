/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Variation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Variation_name_key" ON "Variation"("name");
