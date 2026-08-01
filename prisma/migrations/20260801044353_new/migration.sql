-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_service_provider_id_fkey" FOREIGN KEY ("service_provider_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
