-- AlterTable
ALTER TABLE "ProjectSubmission" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "projectDetails" TEXT;
