-- CreateTable
CREATE TABLE "LawsuitSequenceCounter" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawsuitSequenceCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lawsuit" (
    "id" SERIAL NOT NULL,
    "masterLawsuitId" TEXT NOT NULL,
    "claimNumber" TEXT,
    "lawsuitMatters" TEXT NOT NULL,
    "sharedFolderPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lawsuit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClioToken" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClioToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LawsuitSequenceCounter_year_month_key" ON "LawsuitSequenceCounter"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Lawsuit_masterLawsuitId_key" ON "Lawsuit"("masterLawsuitId");
