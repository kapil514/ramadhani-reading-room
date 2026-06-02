-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "alternatePhone" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "institution" TEXT,
ADD COLUMN     "preferredStudyTime" TEXT,
ADD COLUMN     "referralSource" TEXT,
ADD COLUMN     "studyHoursPerDay" TEXT,
ADD COLUMN     "studyLevel" TEXT;
