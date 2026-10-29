-- AlterTable: add price_overdue column to membership_prices
ALTER TABLE "membership_prices" ADD COLUMN "price_overdue" INTEGER;
