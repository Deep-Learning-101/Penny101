"use server";

import { db } from "@/db";
import { transactions, accounts, categories } from "@/db/schema";
import { eq, and, gte, lt, desc, sql } from "drizzle-orm";
import Decimal from "decimal.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// 載入 dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const TAIWAN_TIMEZONE = "Asia/Taipei";

/**
 * 取得指定年月（台灣時區）的起始與結束時間
 */
function getMonthRange(year: number, month: number) {
  // month 從 1-12
  const startOfMonth = dayjs.tz(`${year}-${month.toString().padStart(2, "0")}-01`, TAIWAN_TIMEZONE).startOf("month");
  const endOfMonth = startOfMonth.add(1, "month");

  return {
    start: startOfMonth.toISOString(),
    end: endOfMonth.toISOString(),
  };
}

/**
 * 1. getDashboardStats - 取得當月總收支與淨資產
 */
export async function getDashboardStats(year: number, month: number) {
  const { start, end } = getMonthRange(year, month);

  // 查詢當月所有交易（只計算 includeInStats = true 的交易）
  const monthTransactions = await db
    .select({
      amount: transactions.amount,
      type: transactions.type,
      includeInStats: transactions.includeInStats,
    })
    .from(transactions)
    .where(
      and(
        gte(transactions.transactionDate, start),
        lt(transactions.transactionDate, end),
        eq(transactions.includeInStats, true)
      )
    );

  // 使用 decimal.js 計算總收入與總支出
  let totalIncome = new Decimal(0);
  let totalExpense = new Decimal(0);

  for (const t of monthTransactions) {
    const amount = new Decimal(t.amount);
    if (t.type === "收入") {
      totalIncome = totalIncome.plus(amount);
    } else if (t.type === "支出") {
      totalExpense = totalExpense.plus(amount);
    }
  }

  // 計算淨資產（收入 - 支出）
  const netWorth = totalIncome.minus(totalExpense);

  return {
    totalIncome: totalIncome.toFixed(2),
    totalExpense: totalExpense.toFixed(2),
    netWorth: netWorth.toFixed(2),
  };
}

/**
 * 2. getMonthlyCategoryPie - 取得當月支出按主分類加總
 */
export async function getMonthlyCategoryPie(year: number, month: number) {
  const { start, end } = getMonthRange(year, month);

  // 查詢當月所有支出交易（含分類資訊）
  const expenseTransactions = await db
    .select({
      amount: transactions.amount,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      parentId: categories.parentId,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        gte(transactions.transactionDate, start),
        lt(transactions.transactionDate, end),
        eq(transactions.type, "支出")
      )
    );

  // 建立分類 ID 到主分類 ID 的映射
  const categoryMap = new Map<number, number>();
  const mainCategoryNames = new Map<number, string>();

  // 查詢所有分類（用於找出主分類）
  const allCategories = await db.select().from(categories);

  for (const cat of allCategories) {
    if (cat.parentId === null) {
      // 主分類
      categoryMap.set(cat.id, cat.id);
      mainCategoryNames.set(cat.id, cat.name);
    } else {
      // 子分類，映射到其父分類
      categoryMap.set(cat.id, cat.parentId);
      // 確保父分類名稱存在
      const parent = allCategories.find((c) => c.id === cat.parentId);
      if (parent) {
        mainCategoryNames.set(cat.parentId, parent.name);
      }
    }
  }

  // 按主分類加總
  const categoryTotals = new Map<number, Decimal>();

  for (const t of expenseTransactions) {
    if (!t.categoryId) continue;

    const mainCategoryId = categoryMap.get(t.categoryId);
    if (!mainCategoryId) continue;

    const amount = new Decimal(t.amount);
    const current = categoryTotals.get(mainCategoryId) || new Decimal(0);
    categoryTotals.set(mainCategoryId, current.plus(amount));
  }

  // 計算總支出（用於計算百分比）
  const totalExpense = Array.from(categoryTotals.values()).reduce(
    (sum, amount) => sum.plus(amount),
    new Decimal(0)
  );

  // 轉換為陣列格式
  const result = Array.from(categoryTotals.entries()).map(([categoryId, amount]) => ({
    categoryId,
    categoryName: mainCategoryNames.get(categoryId) || "未知",
    amount: amount.toFixed(2),
    percentage: totalExpense.gt(0) ? amount.dividedBy(totalExpense).times(100).toFixed(1) : "0.0",
  }));

  // 按金額降序排序
  result.sort((a, b) => new Decimal(b.amount).comparedTo(new Decimal(a.amount)));

  return result;
}

/**
 * 3. getDailyTrend - 取得當月每日支出總額
 */
export async function getDailyTrend(year: number, month: number) {
  const { start, end } = getMonthRange(year, month);

  // 查詢當月所有支出交易
  const expenseTransactions = await db
    .select({
      transactionDate: transactions.transactionDate,
      amount: transactions.amount,
    })
    .from(transactions)
    .where(
      and(
        gte(transactions.transactionDate, start),
        lt(transactions.transactionDate, end),
        eq(transactions.type, "支出")
      )
    );

  // 按日期分組加總
  const dailyTotals = new Map<string, Decimal>();

  for (const t of expenseTransactions) {
    // 轉換為台灣時區的日期（只取日期部分）
    const date = dayjs(t.transactionDate).tz(TAIWAN_TIMEZONE).format("YYYY-MM-DD");
    const amount = new Decimal(t.amount);
    const current = dailyTotals.get(date) || new Decimal(0);
    dailyTotals.set(date, current.plus(amount));
  }

  // 建立完整的日期陣列（包含沒有交易的日期）
  const daysInMonth = dayjs.tz(`${year}-${month.toString().padStart(2, "0")}-01`, TAIWAN_TIMEZONE).daysInMonth();
  const result = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = dayjs
      .tz(`${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`, TAIWAN_TIMEZONE)
      .format("YYYY-MM-DD");

    const amount = dailyTotals.get(date) || new Decimal(0);

    result.push({
      date,
      day: day.toString(),
      amount: amount.toFixed(2),
    });
  }

  return result;
}

/**
 * 4. getRecentTransactions - 取得最新明細清單
 */
export async function getRecentTransactions(limit: number = 20) {
  const recentTransactions = await db
    .select({
      id: transactions.id,
      transactionDate: transactions.transactionDate,
      amount: transactions.amount,
      type: transactions.type,
      memo: transactions.memo,
      accountName: accounts.name,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .orderBy(desc(transactions.transactionDate), desc(transactions.id))
    .limit(limit);

  // 格式化返回資料
  return recentTransactions.map((t) => ({
    id: t.id,
    transactionDate: t.transactionDate,
    // 格式化為台灣時區的顯示字串
    displayDate: dayjs(t.transactionDate).tz(TAIWAN_TIMEZONE).format("YYYY-MM-DD HH:mm"),
    amount: t.amount, // 保持字串格式
    type: t.type,
    memo: t.memo || "",
    accountName: t.accountName || "未知",
    categoryName: t.categoryName || "未知",
  }));
}

/**
 * 5. addTransaction - 新增記帳功能
 */
export async function addTransaction(data: {
  transactionDate: string; // ISO 8601 格式
  amount: string; // 字串格式的金額
  type: "收入" | "支出";
  accountId: number;
  categoryId: number;
  memo?: string;
  includeInStats?: boolean; // 是否計入統計（預設 true）
}) {
  // 驗證金額格式（使用 decimal.js 驗證）
  let amountDecimal: Decimal;
  try {
    amountDecimal = new Decimal(data.amount);
    if (amountDecimal.lte(0)) {
      return {
        success: false,
        error: "金額必須大於 0",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: "金額格式錯誤",
    };
  }

  // 驗證日期格式
  const transactionDate = dayjs(data.transactionDate).tz(TAIWAN_TIMEZONE);
  if (!transactionDate.isValid()) {
    return {
      success: false,
      error: "日期格式錯誤",
    };
  }

  // 新增交易記錄
  try {
    const [result] = await db
      .insert(transactions)
      .values({
        transactionDate: transactionDate.toISOString(),
        amount: amountDecimal.toFixed(2), // 儲存為兩位小數的字串
        type: data.type,
        accountId: data.accountId,
        categoryId: data.categoryId,
        memo: data.memo || null,
        includeInStats: data.includeInStats ?? true,
      })
      .returning();

    return {
      success: true,
      data: {
        id: result.id,
        transactionDate: result.transactionDate,
        amount: result.amount,
        type: result.type,
      },
    };
  } catch (error) {
    console.error("addTransaction error:", error);
    return {
      success: false,
      error: "新增交易失敗，請檢查帳戶與分類是否存在",
    };
  }
}
