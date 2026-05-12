-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "user_wallet" TEXT,
    "email" TEXT,
    "password" TEXT,
    "name" TEXT,
    "mobile" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" TEXT NOT NULL DEFAULT 'active',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "balance" TEXT NOT NULL DEFAULT '0.0000000',
    "is_profit" INTEGER NOT NULL DEFAULT 0,
    "trade_limit" INTEGER NOT NULL DEFAULT 0,
    "is_referral" INTEGER NOT NULL DEFAULT 0,
    "referral_uuid" TEXT,
    "user_registered" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "coin_id" TEXT NOT NULL,
    "coin_name" TEXT NOT NULL,
    "coin_symbol" TEXT NOT NULL,
    "wallet_network" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "wallet_qr" TEXT,
    "coin_amount" TEXT NOT NULL DEFAULT '0.0000000',
    "usd_amount" TEXT NOT NULL DEFAULT '0.00',
    "total_deposits" TEXT NOT NULL DEFAULT '0.0000000',
    "total_withdrawals" TEXT NOT NULL DEFAULT '0.0000000',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION,
    "coin_id" TEXT,
    "coin_symbol" TEXT,
    "wallet_network" TEXT,
    "wallet_address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "proof_image" TEXT,
    "admin_note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "referral_registration_status" TEXT NOT NULL DEFAULT 'enabled',
    "referral_registration_bonus" TEXT NOT NULL DEFAULT '5.00',
    "referral_deposit_bonus_status" TEXT NOT NULL DEFAULT 'enabled',
    "referral_deposit_bonus" TEXT NOT NULL DEFAULT '10',
    "trade_amount_limit" TEXT NOT NULL DEFAULT '5000',
    "deposit_limit" TEXT NOT NULL DEFAULT '20',
    "withdrawal_limit" TEXT NOT NULL DEFAULT '10',
    "notice" TEXT NOT NULL DEFAULT '',
    "hero_bg_color" TEXT NOT NULL DEFAULT '#000000',
    "hero_text_color" TEXT NOT NULL DEFAULT '#ffffff',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_uuid_key" ON "User"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "User_user_wallet_key" ON "User"("user_wallet");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
