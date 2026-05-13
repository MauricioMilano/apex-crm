-- AlterTable
ALTER TABLE "organization_settings" ADD COLUMN     "default_interest_rate" DECIMAL(4,2);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "card_last_four" TEXT,
ADD COLUMN     "installments" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "payment_method_id" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "interest_rate" DECIMAL(4,2),
ADD COLUMN     "requires_prepayment" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "requires_docs" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_organization_id_code_key" ON "payment_methods"("organization_id", "code");

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
