/*
  Warnings:

  - A unique constraint covering the columns `[job_id,extension_number]` on the table `extension_requests` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "extension_requests_job_id_idx" ON "extension_requests"("job_id");

-- CreateIndex
CREATE INDEX "extension_requests_requester_id_idx" ON "extension_requests"("requester_id");

-- CreateIndex
CREATE INDEX "extension_requests_reviewer_id_idx" ON "extension_requests"("reviewer_id");

-- CreateIndex
CREATE INDEX "extension_requests_status_idx" ON "extension_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "extension_requests_job_id_extension_number_key" ON "extension_requests"("job_id", "extension_number");
