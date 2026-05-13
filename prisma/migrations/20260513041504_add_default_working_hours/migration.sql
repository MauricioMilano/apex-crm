-- AlterTable
ALTER TABLE "organization_settings" ADD COLUMN     "default_working_hours" JSONB NOT NULL DEFAULT '{}';
