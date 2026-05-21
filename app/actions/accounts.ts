"use server";

import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * 取得所有帳戶清單
 */
export async function getAccounts() {
  const allAccounts = await db
    .select()
    .from(accounts)
    .orderBy(accounts.isActive, accounts.name);

  return allAccounts;
}

/**
 * 取得所有啟用的帳戶
 */
export async function getActiveAccounts() {
  const activeAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.isActive, true))
    .orderBy(accounts.name);

  return activeAccounts;
}

/**
 * 新增帳戶
 */
export async function createAccount(data: {
  name: string;
  type: "銀行" | "現金" | "電子支付";
  currency?: string;
  initialBalance?: string;
  includeInTotal?: boolean;
}) {
  try {
    const [result] = await db
      .insert(accounts)
      .values({
        name: data.name,
        type: data.type,
        currency: data.currency || "TWD",
        initialBalance: data.initialBalance || "0",
        includeInTotal: data.includeInTotal ?? true,
        isActive: true,
      })
      .returning();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("createAccount error:", error);
    return {
      success: false,
      error: "新增帳戶失敗",
    };
  }
}

/**
 * 更新帳戶
 */
export async function updateAccount(
  id: number,
  data: {
    name?: string;
    type?: "銀行" | "現金" | "電子支付";
    currency?: string;
    initialBalance?: string;
    includeInTotal?: boolean;
    isActive?: boolean;
  }
) {
  try {
    const [result] = await db
      .update(accounts)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(accounts.id, id))
      .returning();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("updateAccount error:", error);
    return {
      success: false,
      error: "更新帳戶失敗",
    };
  }
}

/**
 * 停用帳戶（軟刪除）
 */
export async function deactivateAccount(id: number) {
  return updateAccount(id, { isActive: false });
}

/**
 * 調換兩個帳戶的排序順序
 */
export async function swapAccountOrder(accountId1: number, accountId2: number) {
  try {
    // 取得兩個帳戶的排序順序
    const [account1] = await db
      .select({ sortOrder: accounts.sortOrder })
      .from(accounts)
      .where(eq(accounts.id, accountId1))
      .limit(1);

    const [account2] = await db
      .select({ sortOrder: accounts.sortOrder })
      .from(accounts)
      .where(eq(accounts.id, accountId2))
      .limit(1);

    if (!account1 || !account2) {
      return { success: false, error: "帳戶不存在" };
    }

    // 交換排序順序
    await db
      .update(accounts)
      .set({ sortOrder: account2.sortOrder })
      .where(eq(accounts.id, accountId1));

    await db
      .update(accounts)
      .set({ sortOrder: account1.sortOrder })
      .where(eq(accounts.id, accountId2));

    revalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    console.error("swapAccountOrder error:", error);
    return { success: false, error: "排序失敗" };
  }
}

/**
 * 一鍵重新計算所有帳戶餘額（用於同步驗證）
 * 此函數會重新計算所有帳戶的餘額，但不會修改資料庫
 * 返回計算結果供前端顯示
 */
export async function recalculateAllBalances() {
  try {
    const { getAccountsWithBalance } = await import("./accountsBalance");
    const accountsWithBalance = await getAccountsWithBalance();

    revalidatePath("/accounts");
    revalidatePath("/");

    return {
      success: true,
      data: accountsWithBalance,
      message: `成功重新計算 ${accountsWithBalance.length} 個帳戶餘額`,
    };
  } catch (error) {
    console.error("recalculateAllBalances error:", error);
    return {
      success: false,
      error: "重新計算失敗",
    };
  }
}
