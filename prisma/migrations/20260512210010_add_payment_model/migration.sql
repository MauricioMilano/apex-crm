-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'completed', 'refunded', 'failed', 'adjusted');

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "payment_status" NOT NULL,
    "reference_type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "adjusted_payment_id" TEXT,
    "description" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_adjusted_payment_id_fkey" FOREIGN KEY ("adjusted_payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
