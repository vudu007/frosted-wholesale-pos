-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'CSV', 'HTML');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "costPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "isTaxable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "size" TEXT;

-- CreateTable
CREATE TABLE "EmailReportConfig" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "frequency" "ReportFrequency" NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "includeMetrics" BOOLEAN NOT NULL DEFAULT true,
    "includeSalesTrend" BOOLEAN NOT NULL DEFAULT true,
    "includeGeography" BOOLEAN NOT NULL DEFAULT true,
    "includeTopProducts" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSent" TIMESTAMP(3),
    "nextSend" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailReportConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailReportRecipient" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailReportRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExecutionLog" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipients" TEXT[],
    "duration" INTEGER,

    CONSTRAINT "ReportExecutionLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmailReportConfig" ADD CONSTRAINT "EmailReportConfig_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailReportRecipient" ADD CONSTRAINT "EmailReportRecipient_configId_fkey" FOREIGN KEY ("configId") REFERENCES "EmailReportConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExecutionLog" ADD CONSTRAINT "ReportExecutionLog_configId_fkey" FOREIGN KEY ("configId") REFERENCES "EmailReportConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
