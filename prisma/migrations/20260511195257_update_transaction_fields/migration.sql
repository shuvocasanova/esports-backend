/*
  Warnings:

  - You are about to drop the column `proof_image` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `wallet_address` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `wallet_network` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "btn_bg_color" TEXT NOT NULL DEFAULT '#000000',
ADD COLUMN     "btn_text_color" TEXT NOT NULL DEFAULT '#ffffff',
ADD COLUMN     "email" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "whatsapp" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "proof_image",
DROP COLUMN "total_amount",
DROP COLUMN "wallet_address",
DROP COLUMN "wallet_network",
ADD COLUMN     "coin_name" TEXT,
ADD COLUMN     "documents" TEXT,
ADD COLUMN     "trans_hash" TEXT,
ADD COLUMN     "wallet_from" TEXT,
ADD COLUMN     "wallet_to" TEXT,
ALTER COLUMN "amount" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "employee" TEXT NOT NULL DEFAULT 'user',
ADD COLUMN     "message_status" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "referral_bonus" TEXT NOT NULL DEFAULT '0.00';

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "coin_logo" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "TradeOrder" (
    "id" SERIAL NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_type" TEXT NOT NULL,
    "order_position" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_wallet" TEXT,
    "wallet_coin_id" TEXT,
    "trade_coin_id" TEXT,
    "trade_coin_symbol" TEXT,
    "amount" TEXT NOT NULL,
    "wallet_amount" TEXT,
    "profit_amount" TEXT,
    "purchase_price" TEXT,
    "delivery_price" TEXT,
    "wallet_profit_amount" TEXT,
    "delivery_time" TEXT,
    "profit_level" TEXT,
    "is_profit" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "user_uuid" TEXT,
    "asigned_employee" TEXT,
    "wallet_coin_name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimerProfit" (
    "id" SERIAL NOT NULL,
    "timer" TEXT NOT NULL,
    "profit" TEXT NOT NULL,
    "mini_usdt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimerProfit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TradeOrder_order_id_key" ON "TradeOrder"("order_id");

-- AddForeignKey
ALTER TABLE "TradeOrder" ADD CONSTRAINT "TradeOrder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
