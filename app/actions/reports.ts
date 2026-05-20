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
    const amount = new Decimal(t.amount);
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
    transactionCount: monthTransactions.length,
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
    const amount = new Decimal(t.amount);
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
    transactionCount: yearTransactions.length,
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
      total: sql<string>`SUM(${transactions.amount})`,
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
      entry.income = row.total;
    } else if (row.type === "支出") {
      entry.expense = row.total;
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
      categoryName: sql<string>`c.name`,
      total: sql<string>`SUM(t.amount)`,
    })
    .from(transactions)
    .innerJoin(sql`categories c`, sql`c.id = ${transactions.categoryId}`)
    .where(
      and(
        gte(transactions.transactionDate, start),
        lt(transactions.transactionDate, end),
        sql`${transactions.type} = '支出'`
      )
    )
    .groupBy(sql`c.name`)
    .orderBy(sql`SUM(t.amount) DESC`);

  // 計算總支出
  let totalExpense = new Decimal(0);
  for (const row of categoryData) {
    totalExpense = totalExpense.plus(row.total);
  }

  // 計算百分比
  return categoryData.map((row) => {
    const amount = new Decimal(row.total);
    const percentage =
      totalExpense.toNumber() > 0
        ? amount.dividedBy(totalExpense).times(100).toFixed(1)
        : "0";

    return {
      name: row.categoryName,
      value: parseFloat(row.total),
      percentage,
    };
  });
}
