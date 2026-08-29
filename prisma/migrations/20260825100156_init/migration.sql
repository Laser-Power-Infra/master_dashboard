-- CreateEnum
CREATE TYPE "Category" AS ENUM ('CORE_INFRASTRUCTURE', 'MICROSERVICE', 'DATABASE', 'FRONTEND', 'API', 'WORKERS');

-- CreateEnum
CREATE TYPE "Protocol" AS ENUM ('HTTP', 'HTTPS', 'TCP');

-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "Category" NOT NULL,
    "ip" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "protocol" "Protocol" NOT NULL DEFAULT 'HTTP',
    "healthcheck" TEXT,
    "baseUrl" TEXT,
    "isLarge" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthCheck" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" "CheckStatus" NOT NULL,
    "latencyMs" INTEGER,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ServiceToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ServiceToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

-- CreateIndex
CREATE INDEX "Service_category_idx" ON "Service"("category");

-- CreateIndex
CREATE INDEX "HealthCheck_serviceId_checkedAt_idx" ON "HealthCheck"("serviceId", "checkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "_ServiceToTag_B_index" ON "_ServiceToTag"("B");

-- AddForeignKey
ALTER TABLE "HealthCheck" ADD CONSTRAINT "HealthCheck_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceToTag" ADD CONSTRAINT "_ServiceToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceToTag" ADD CONSTRAINT "_ServiceToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
