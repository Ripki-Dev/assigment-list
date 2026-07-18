-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "additionalContext" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "roleAnalysis" JSONB,
    "questions" JSONB,
    "evaluation" JSONB,
    "qualityScore" DOUBLE PRECISION,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);
