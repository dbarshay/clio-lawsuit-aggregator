-- CreateTable
CREATE TABLE "LawsuitSequenceCounter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Lawsuit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "masterLawsuitId" TEXT NOT NULL,
    "claimNumber" TEXT,
    "lawsuitMatters" TEXT NOT NULL,
    "sharedFolderPath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ClioToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "LawsuitSequenceCounter_year_month_key" ON "LawsuitSequenceCounter"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Lawsuit_masterLawsuitId_key" ON "Lawsuit"("masterLawsuitId");
