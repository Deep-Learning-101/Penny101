-- 新增帳戶的初始餘額與是否計入統計欄位
ALTER TABLE "accounts" ADD COLUMN "initial_balance" numeric(12, 2) DEFAULT '0' NOT NULL;
ALTER TABLE "accounts" ADD COLUMN "include_in_total" boolean DEFAULT true NOT NULL;

-- 新增交易的是否計入統計欄位
ALTER TABLE "transactions" ADD COLUMN "include_in_stats" boolean DEFAULT true NOT NULL;
