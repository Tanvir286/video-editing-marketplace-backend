/*
  Warnings:

  - The `status` column on the `hires` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "HireStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'CANCELLED', 'COMPLETED');

-- AlterTable
ALTER TABLE "hires" DROP COLUMN "status",
ADD COLUMN     "status" "HireStatus" NOT NULL DEFAULT 'PENDING';
