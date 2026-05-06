-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_client_id_fkey";

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "lead_id" TEXT,
ALTER COLUMN "client_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
