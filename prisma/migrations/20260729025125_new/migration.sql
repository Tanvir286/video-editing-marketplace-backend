/*
  Warnings:

  - Made the column `hire_profile_id` on table `hires` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "hires" ALTER COLUMN "hire_profile_id" SET NOT NULL;
