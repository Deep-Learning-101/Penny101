"use server";

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { and, gte, lt, sql } from "drizzle-orm";
import Decimal from "decimal.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const TAIWAN_TIMEZONE = "Asia/Taipei";

/**
 * 取得月份範圍
 */
function getMonthRange(year: number, month: number) {
  const startOfMonth = dayjs
    .tz(`${year}-${month.toString().padStart(2, "0")}-01`, TAIWAN_TIMEZONE)
    .startOf("month");
  const endOfMonth = startOfMonth.add(1, "month");

  return {
    start: startOfMonth.toISOString(),
    end: endOfMonth.toISOString(),
  };
}

/**
 * 取得年份範圍
 */
function getYearRange(year: number) {
  const startOfYear = dayjs
    .tz(`${year}-01-01`, TAIWAN_TIMEZONE)
    .startOf("year");
  const endOfYear = startOfYear.add(1, "year");

  return {
    start: startOfYear.toISOString(),
    end: endOfYear.toISOString(),
  };
}

/**
 * 取得本月總結
 */
export async function getMonthSummary(year: number, month: number) {
  const { start, end } = getMonthRange(year, month);

  const monthTransactions = await db
    .select({
      amount: transactions.amount,
      type: transactions.type,
    })
    .from(transactions)
    .where(and(gte(transactions.transactionDate, start), lt(transactions.transactionDate, end)));

  let totalIncome = new Decimal(0);
  let totalExpense = new Decimal(0);

  for (const t of monthTransactions) {
    const amount = new Decimal(t.amount || "0");
    if (t.type === "收入") {
      totalIncome = totalIncome.plus(amount);
    } else if (t.type === "支出") {
      totalExpense = totalExpense.plus(amount);
    }
  }

  return {
    totalIncome: totalIncome.toFixed(2),
    totalExpense: totalExpense.toFixed(2),
    netWorth: totalIncome.minus(totalExpense).toFixed(2),
    transactionCount: monthTransactions.length || 0,
  };
}

/**
 * 取得本年總結
 */
export async function getYearSummary(year: number) {
  const { start, end } = getYearRange(year);

  const yearTransactions = await db
    .select({
      amount: transactions.amount,
      type: transactions.type,
    })
    .from(transactions)
    .where(and(gte(transactions.transactionDate, start), lt(transactions.transactionDate, end)));

  let totalIncome = new Decimal(0);
  let totalExpense = new Decimal(0);

  for (const t of yearTransactions) {
    const amount = new Decimal(t.amount || "0");
    if (t.type === "收入") {
      totalIncome = totalIncome.plus(amount);
    } else if (t.type === "支出") {
      totalExpense = totalExpense.plus(amount);
    }
  }

  return {
    totalIncome: totalIncome.toFixed(2),
    totalExpense: totalExpense.toFixed(2),
    netWorth: totalIncome.minus(totalExpense).toFixed(2),
    transactionCount: yearTransactions.length || 0,
  };
}

/**
 * 取得本年度每月收支趨勢
 */
export async function getYearlyTrend(year: number) {
  const { start, end } = getYearRange(year);

  const monthlyData = await db
    .select({
      month: sql<string>`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`,
      type: transactions.type,
      total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(and(gte(transactions.transactionDate, start), lt(transactions.transactionDate, end)))
    .groupBy(sql`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`, transactions.type)
    .orderBy(sql`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`);

  // 整理成前端需要的格式
  const monthMap = new Map<
    string,
    { month: string; income: string; expense: string }
  >();

  for (const row of monthlyData) {
    if (!monthMap.has(row.month)) {
      monthMap.set(row.month, { month: row.month, income: "0", expense: "0" });
    }
    const entry = monthMap.get(row.month)!;
    if (row.type === "收入") {
      entry.income = row.total || "0";
    } else if (row.type === "支出") {
      entry.expense = row.total || "0";
    }
  }

  return Array.from(monthMap.values());
}

/**
 * 取得支出分類圓餅圖（本年度）
 */
export async function getYearlyExpenseByCategory(year: number) {
  const { start, end } = getYearRange(year);

  const categoryData = await db
    .select({
      categoryName: categories.name,
      total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        gte(transactions.transactionDate, start),
        lt(transactions.transactionDate, end),
        eq(transactions.type, "支出")
      )
    )
    .groupBy(categories.name)
    .orderBy(sql`COALESCE(SUM(${transactions.amount}), 0) DESC`);

  // 如果沒有資料，回傳空陣列
  if (!categoryData || categoryData.length === 0) {
    return [];
  }

  // 計算總支出
  let totalExpense = new Decimal(0);
  for (const row of categoryData) {
    totalExpense = totalExpense.plus(row.total || "0");
  }

  // 計算百分比
  return categoryData.map((row) => {
    const amount = new Decimal(row.total || "0");
    const percentage =
      totalExpense.toNumber() > 0
        ? amount.dividedBy(totalExpense).times(100).toFixed(1)
        : "0";

    return {
      name: row.categoryName || "未知",
      value: parseFloat(row.total || "0"),
      percentage,
    };
  });
}
