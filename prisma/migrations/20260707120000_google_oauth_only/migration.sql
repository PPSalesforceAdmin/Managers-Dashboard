-- AlterTable
ALTER TABLE "User" DROP COLUMN "passwordHash",
DROP COLUMN "mfaSecret",
DROP COLUMN "mfaEnabled",
DROP COLUMN "forcePasswordChange";
