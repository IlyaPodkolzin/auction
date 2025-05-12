/*
  Warnings:

  - You are about to drop the column `startPrice` on the `Lot` table. All the data in the column will be lost.
  - The `status` column on the `Lot` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BID_PLACED', 'BID_OVERTAKEN', 'SOLD', 'WON', 'CANCELLED', 'BID_DELETED');

-- DropIndex
DROP INDEX "Notification_lotId_idx";

-- DropIndex
DROP INDEX "Notification_userId_idx";

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Lot" DROP COLUMN "startPrice",
ADD COLUMN     "initialPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "LotStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "category" SET DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DEFAULT 'Пользователь';
