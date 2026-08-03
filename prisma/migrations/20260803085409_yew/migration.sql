/*
  Warnings:

  - You are about to drop the column `content_length` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `deadline` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `fileId` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `project_budget` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `project_duration` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `skill` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `started_at` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the column `total_payment` on the `jobs` table. All the data in the column will be lost.
  - You are about to drop the `_AttachmentToJOB` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `job_budget` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_content_length` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_platform` to the `jobs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_AttachmentToJOB" DROP CONSTRAINT "_AttachmentToJOB_A_fkey";

-- DropForeignKey
ALTER TABLE "_AttachmentToJOB" DROP CONSTRAINT "_AttachmentToJOB_B_fkey";

-- AlterTable
ALTER TABLE "jobs" DROP COLUMN "content_length",
DROP COLUMN "deadline",
DROP COLUMN "fileId",
DROP COLUMN "platform",
DROP COLUMN "project_budget",
DROP COLUMN "project_duration",
DROP COLUMN "reference",
DROP COLUMN "skill",
DROP COLUMN "started_at",
DROP COLUMN "status",
DROP COLUMN "total_payment",
ADD COLUMN     "job_budget" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "job_content_length" "ContentLength" NOT NULL,
ADD COLUMN     "job_deadline" TIMESTAMP(3),
ADD COLUMN     "job_documentation" TEXT,
ADD COLUMN     "job_duration" DOUBLE PRECISION,
ADD COLUMN     "job_pdf" TEXT,
ADD COLUMN     "job_platform" "Platform" NOT NULL,
ADD COLUMN     "job_skill" TEXT,
ADD COLUMN     "job_startedat" TIMESTAMP(3),
ADD COLUMN     "job_status" "JobStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "job_style_reference" TEXT,
ADD COLUMN     "job_total_payment" DOUBLE PRECISION;

-- DropTable
DROP TABLE "_AttachmentToJOB";
