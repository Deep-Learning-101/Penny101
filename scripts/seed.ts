/**
 * 資料庫種子資料腳本
 * 執行方式：npx tsx scripts/seed.ts
 */

import { db } from "../db";
import { accounts, categories, transactions } from "../db/schema";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const TAIWAN_TIMEZONE = "Asia/Taipei";

async function seed() {
  console.log("🌱 開始建立種子資料...\n");

  try {
    // 1. 建立帳戶
    console.log("📦 建立帳戶...");
    const [cashAccount] = await db
      .insert(accounts)
      .values({
        name: "現金",
        type: "現金",
        currency: "TWD",
        isActive: true,
      })
      .returning();

    const [bankAccount] = await db
      .insert(accounts)
      .values({
        name: "中信銀行",
        type: "銀行",
        currency: "TWD",
        isActive: true,
      })
      .returning();

    const [linePayAccount] = await db
      .insert(accounts)
      .values({
        name: "LINE Pay",
        type: "電子支付",
        currency: "TWD",
        isActive: true,
      })
      .returning();

    console.log(`✅ 建立 3 個帳戶`);
    console.log("");

    // 2. 建立支出分類
    console.log("📦 建立支出分類...");
    const [foodCategory] = await db
      .insert(categories)
      .values({
        name: "飲食",
        type: "支出",
        parentId: null,
      })
      .returning();

    await db.insert(categories).values([
      { name: "早餐", type: "支出", parentId: foodCategory.id },
      { name: "午餐", type: "支出", parentId: foodCategory.id },
      { name: "晚餐", type: "支出", parentId: foodCategory.id },
      { name: "飲料", type: "支出", parentId: foodCategory.id },
    ]);

    const [transportCategory] = await db
      .insert(categories)
      .values({
        name: "交通",
        type: "支出",
        parentId: null,
      })
      .returning();

    await db.insert(categories).values([
      { name: "捷運", type: "支出", parentId: transportCategory.id },
      { name: "計程車", type: "支出", parentId: transportCategory.id },
      { name: "加油", type: "支出", parentId: transportCategory.id },
    ]);

    const [shoppingCategory] = await db
      .insert(categories)
      .values({
        name: "購物",
        type: "支出",
        parentId: null,
      })
      .returning();

    await db.insert(categories).values([
      { name: "服飾", type: "支出", parentId: shoppingCategory.id },
      { name: "3C", type: "支出", parentId: shoppingCategory.id },
    ]);

    const [entertainmentCategory] = await db
      .insert(categories)
      .values({
        name: "娛樂",
        type: "支出",
        parentId: null,
      })
      .returning();

    await db.insert(categories).values([
      { name: "電影", type: "支出", parentId: entertainmentCategory.id },
      { name: "遊戲", type: "支出", parentId: entertainmentCategory.id },
    ]);

    console.log(`✅ 建立支出分類（4 個主分類，11 個子分類）`);
    console.log("");

    // 3. 建立收入分類
    console.log("📦 建立收入分類...");
    const [salaryCategory] = await db
      .insert(categories)
      .values({
        name: "薪資",
        type: "收入",
        parentId: null,
      })
      .returning();

    const [bonusCategory] = await db
      .insert(categories)
      .values({
        name: "獎金",
        type: "收入",
        parentId: null,
      })
      .returning();

    const [investmentCategory] = await db
      .insert(categories)
      .values({
        name: "投資",
        type: "收入",
        parentId: null,
      })
      .returning();

    console.log(`✅ 建立收入分類（3 個主分類）`);
    console.log("");

    // 4. 建立交易記錄（2026年5月的測試資料）
    console.log("📦 建立交易記錄...");

    // 取得所有子分類
    const allCategories = await db.select().from(categories);
    const breakfastCat = allCategories.find((c) => c.name === "早餐");
    const lunchCat = allCategories.find((c) => c.name === "午餐");
    const dinnerCat = allCategories.find((c) => c.name === "晚餐");
    const drinkCat = allCategories.find((c) => c.name === "飲料");
    const mrtCat = allCategories.find((c) => c.name === "捷運");
    const movieCat = allCategories.find((c) => c.name === "電影");

    const transactionsData = [
      // 收入
      {
        transactionDate: dayjs.tz("2026-05-01 10:00", TAIWAN_TIMEZONE).toISOString(),
        amount: "50000.00",
        type: "收入" as const,
        accountId: bankAccount.id,
        categoryId: salaryCategory.id,
        memo: "五月薪資",
      },
      // 日常支出
      {
        transactionDate: dayjs.tz("2026-05-02 08:30", TAIWAN_TIMEZONE).toISOString(),
        amount: "65.00",
        type: "支出" as const,
        accountId: cashAccount.id,
        categoryId: breakfastCat!.id,
        memo: "早餐店",
      },
      {
        transactionDate: dayjs.tz("2026-05-02 12:15", TAIWAN_TIMEZONE).toISOString(),
        amount: "120.00",
        type: "支出" as const,
        accountId: linePayAccount.id,
        categoryId: lunchCat!.id,
        memo: "便當",
      },
      {
        transactionDate: dayjs.tz("2026-05-02 19:00", TAIWAN_TIMEZONE).toISOString(),
        amount: "250.00",
        type: "支出" as const,
        accountId: bankAccount.id,
        categoryId: dinnerCat!.id,
        memo: "聚餐",
      },
      {
        transactionDate: dayjs.tz("2026-05-03 14:30", TAIWAN_TIMEZONE).toISOString(),
        amount: "55.00",
        type: "支出" as const,
        accountId: cashAccount.id,
        categoryId: drinkCat!.id,
        memo: "星巴克",
      },
      {
        transactionDate: dayjs.tz("2026-05-03 18:00", TAIWAN_TIMEZONE).toISOString(),
        amount: "32.00",
        type: "支出" as const,
        accountId: linePayAccount.id,
        categoryId: mrtCat!.id,
        memo: "捷運",
      },
      {
        transactionDate: dayjs.tz("2026-05-05 20:00", TAIWAN_TIMEZONE).toISOString(),
        amount: "350.00",
        type: "支出" as const,
        accountId: bankAccount.id,
        categoryId: movieCat!.id,
        memo: "看電影",
      },
      // 更多交易...
      {
        transactionDate: dayjs.tz("2026-05-10 08:00", TAIWAN_TIMEZONE).toISOString(),
        amount: "60.00",
        type: "支出" as const,
        accountId: cashAccount.id,
        categoryId: breakfastCat!.id,
        memo: "麥當勞",
      },
      {
        transactionDate: dayjs.tz("2026-05-10 12:30", TAIWAN_TIMEZONE).toISOString(),
        amount: "150.00",
        type: "支出" as const,
        accountId: linePayAccount.id,
        categoryId: lunchCat!.id,
        memo: "牛肉麵",
      },
      {
        transactionDate: dayjs.tz("2026-05-15 10:00", TAIWAN_TIMEZONE).toISOString(),
        amount: "5000.00",
        type: "收入" as const,
        accountId: bankAccount.id,
        categoryId: bonusCategory.id,
        memo: "專案獎金",
      },
    ];

    await db.insert(transactions).values(transactionsData);

    console.log(`✅ 建立 ${transactionsData.length} 筆交易記錄`);
    console.log("");

    console.log("✅ 種子資料建立完成！");
    console.log("\n📊 資料統計：");
    console.log(`   - 帳戶: 3 個`);
    console.log(`   - 分類: 7 個主分類，11 個子分類`);
    console.log(`   - 交易: ${transactionsData.length} 筆`);
  } catch (error) {
    console.error("❌ 建立種子資料失敗：", error);
    process.exit(1);
  }
}

seed();
