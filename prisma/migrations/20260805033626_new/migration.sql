/*
  Warnings:

  - You are about to drop the column `user_id` on the `extension_requests` table. All the data in the column will be lost.
  - Added the required column `extension_number` to the `extension_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requester_id` to the `extension_requests` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "extension_requests" DROP CONSTRAINT "extension_requests_user_id_fkey";

-- AlterTable
ALTER TABLE "extension_requests" DROP COLUMN "user_id",
ADD COLUMN     "attachmentment_file" TEXT,
ADD COLUMN     "extension_number" INTEGER NOT NULL,
ADD COLUMN     "requester_id" TEXT NOT NULL,
ADD COLUMN     "reviewer_id" TEXT;

-- AddForeignKey
ALTER TABLE "extension_requests" ADD CONSTRAINT "extension_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_requests" ADD CONSTRAINT "extension_requests_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
