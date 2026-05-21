"use server";

import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import Decimal from "decimal.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

/**
 * 取得所有帳戶及其餘額（包含初始餘額）
 */
export async function getAccountsWithBalance() {
  const allAccounts = await db.select().from(accounts).orderBy(accounts.sortOrder, accounts.name);

  const accountsWithBalance = await Promise.all(
    allAccounts.map(async (account) => {
      // 計算該帳戶的總收入和總支出
      const accountTransactions = await db
        .select({
          amount: transactions.amount,
          type: transactions.type,
        })
        .from(transactions)
        .where(eq(transactions.accountId, account.id));

      let totalIncome = new Decimal(0);
      let totalExpense = new Decimal(0);

      for (const t of accountTransactions) {
        const amount = new Decimal(t.amount || "0");
        if (t.type === "收入") {
          totalIncome = totalIncome.plus(amount);
        } else if (t.type === "支出") {
          totalExpense = totalExpense.plus(amount);
        }
      }

      // 餘額 = 初始餘額 + 收入 - 支出
      const initialBalance = new Decimal(account.initialBalance || "0");
      const balance = initialBalance.plus(totalIncome).minus(totalExpense);

      return {
        id: account.id,
        name: account.name,
        type: account.type,
        isActive: account.isActive,
        initialBalance: account.initialBalance,
        includeInTotal: account.includeInTotal,
        balance: balance.toFixed(2),
        transactionCount: accountTransactions.length,
      };
    })
  );

  return accountsWithBalance;
}

/**
 * 取得特定帳戶的交易明細（支援時間範圍篩選）
 * @param accountId 帳戶 ID
 * @param range 時間範圍：'3m' | '6m' | '1y' | 'all'（預設 '6m'）
 */
export async function getAccountTransactions(
  accountId: number,
  range: '3m' | '6m' | '1y' | 'all' = '6m'
) {
  // 初始化 dayjs plugins
  dayjs.extend(utc);
  dayjs.extend(timezone);

  // 計算時間範圍的起始時間
  let startDate: string | null = null;
  const now = dayjs().tz("Asia/Taipei");

  switch (range) {
    case '3m':
      startDate = now.subtract(3, 'month').toISOString();
      break;
    case '6m':
      startDate = now.subtract(6, 'month').toISOString();
      break;
    case '1y':
      startDate = now.subtract(1, 'year').toISOString();
      break;
    case 'all':
      startDate = null; // 不限制時間
      break;
  }

  const accountTransactions = await db
    .select({
      id: transactions.id,
      transactionDate: transactions.transactionDate,
      amount: transactions.amount,
      type: transactions.type,
      categoryId: transactions.categoryId,
      memo: transactions.memo,
    })
    .from(transactions)
    .where(
      startDate
        ? and(eq(transactions.accountId, accountId), gte(transactions.transactionDate, startDate))
        : eq(transactions.accountId, accountId)
    )
    .orderBy(sql`${transactions.transactionDate} DESC`);

  // 取得分類名稱
  const result = await Promise.all(
    accountTransactions.map(async (t) => {
      const [category] = await db
        .select({ name: sql<string>`name` })
        .from(sql`categories`)
        .where(sql`id = ${t.categoryId}`)
        .limit(1);

      return {
        id: t.id,
        transactionDate: t.transactionDate,
        displayDate: new Date(t.transactionDate).toLocaleDateString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
        amount: t.amount,
        type: t.type,
        categoryName: category?.name || "未知",
        memo: t.memo || "",
      };
    })
  );

  return result;
}

/**
 * 取得帳戶資訊
 */
export async function getAccountInfo(accountId: number) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  return account || null;
}

/**
 * 計算總資產（只計算 includeInTotal = true 的帳戶）
 */
export async function getTotalAssets() {
  const accountsWithBalance = await getAccountsWithBalance();

  let totalAssets = new Decimal(0);

  for (const account of accountsWithBalance) {
    if (account.includeInTotal) {
      totalAssets = totalAssets.plus(new Decimal(account.balance));
    }
  }

  return {
    totalAssets: totalAssets.toFixed(2),
    includedAccountsCount: accountsWithBalance.filter((a) => a.includeInTotal).length,
  };
}

/**
 * 取得帳戶總覽統計（總淨資產與淨負債）
 */
export async function getAccountsSummary() {
  const accountsWithBalance = await getAccountsWithBalance();

  let netWorth = new Decimal(0); // 總淨資產（所有帳戶餘額加總）
  let totalLiabilities = new Decimal(0); // 淨負債（僅負數帳戶的絕對值加總）

  for (const account of accountsWithBalance) {
    if (account.includeInTotal) {
      const balance = new Decimal(account.balance);
      netWorth = netWorth.plus(balance);

      // 如果帳戶餘額為負，計入負債
      if (balance.lessThan(0)) {
        totalLiabilities = totalLiabilities.plus(balance.abs());
      }
    }
  }

  return {
    netWorth: netWorth.toFixed(2),
    totalLiabilities: totalLiabilities.toFixed(2),
    accountCount: accountsWithBalance.filter((a) => a.includeInTotal).length,
  };
}
