-- CreateTable
CREATE TABLE "email_schedules" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '{}',
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "reference_type" TEXT,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_schedules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "email_schedules" ADD CONSTRAINT "email_schedules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
