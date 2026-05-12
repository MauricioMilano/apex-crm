-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "currency" TEXT;

-- AlterTable
ALTER TABLE "organization_settings" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "date_format" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
ADD COLUMN     "locale" TEXT DEFAULT 'en-US',
ADD COLUMN     "time_format" TEXT NOT NULL DEFAULT '12h',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/New_York';
